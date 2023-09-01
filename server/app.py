from flask import Flask, send_from_directory
from http import HTTPStatus


app = Flask(__name__, static_folder="../client/build")


@app.route("/")
def base():
    return send_from_directory("../client/build", "index.html"), HTTPStatus.OK


# Path for all the static files (compiled JS/CSS, etc.)
@app.route("/<path:path>")
def home(path):
    return send_from_directory("../client/build", path)


if __name__ == "__main__":
    app.run()
