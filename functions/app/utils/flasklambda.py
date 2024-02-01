# https://github.com/rackerlabs/fleece/blob/master/fleece/handlers/wsgi.py
# https://github.com/sivel/flask-lambda
import base64
from flask import Flask
import os
from werkzeug.test import EnvironBuilder


# This function converts an AWS ApiGateway event into
# a WSGI Environ that flask recognizes.
def build_wsgi_environ_from_event(event):
    """Create a WSGI environment from the proxy integration event."""
    params = event.get("multiValueQueryStringParameters")
    environ = EnvironBuilder(
        method=event.get("httpMethod") or "GET",
        path=event.get("path") or "/",
        headers=event.get("headers") or {},
        data=event.get("body") or b"",
        query_string=params or {},
    ).get_environ()
    environ["SERVER_PORT"] = 443
    if "execute-api" in environ["HTTP_HOST"]:
        # this is the API-Gateway hostname, which takes the stage as the first
        # script path component
        environ["SCRIPT_NAME"] = "/" + event["requestContext"].get("stage")
    else:
        # we are using our own hostname, nothing gets added to the script path
        environ["SCRIPT_NAME"] = ""
    environ["wsgi.url_scheme"] = "https"
    environ["lambda.event"] = event
    return environ


# This extends the flask class allowing us to have it work with a lambda.
# And still work locally as well.
class FlaskLambda(Flask):
    def __call__(self, event, context):
        if "httpMethod" not in event:
            # In this "context" `event` is `environ` and
            # `context` is `start_response`, meaning the request didn't
            # occur via API Gateway and Lambda so its a regular flask event
            return super(FlaskLambda, self).__call__(event, context)
        os.environ["AWS_REQUEST_ID"] = context.aws_request_id
        environ = build_wsgi_environ_from_event(event)
        wsgi_status = []
        wsgi_headers = []

        def start_response(status, headers, exc_info=None):
            if len(wsgi_status) or len(wsgi_headers):
                raise RuntimeError("start_response called more than once!")
            wsgi_status.append(status)
            wsgi_headers.append(headers)

        resp = list(self.wsgi_app(environ, start_response))

        # Check content type before decoding response
        content_type = None
        for key, value in wsgi_headers[0]:
            if key.lower() == "content-type":
                content_type = value
                break

        if content_type and content_type.startswith(("image/", "audio/")):
            # Return image data as binary response
            body = base64.b64encode(b"".join(resp)).decode("utf-8")
            isBase64Encoded = True
        else:
            # Decode response as UTF-8 string
            body = b"".join(resp).decode("utf-8")
            isBase64Encoded = False

        proxy = {
            "isBase64Encoded": isBase64Encoded,
            "statusCode": int(wsgi_status[0].split()[0]),
            "headers": {h[0]: h[1] for h in wsgi_headers[0]},
            "body": body,
        }
        return proxy
