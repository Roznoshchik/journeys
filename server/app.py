from flask import Flask, send_from_directory
from http import HTTPStatus


app = Flask(__name__)


@app.route("/")
def base():
    return send_from_directory("../client/build", "index.html"), HTTPStatus.OK


if __name__ == "__main__":
    app.run()
