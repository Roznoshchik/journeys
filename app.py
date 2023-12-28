from flask import Flask, render_template
from http import HTTPStatus


app = Flask(__name__, static_folder="../client/build")


@app.route("/")
def base():
    return render_template("index.html")


@app.errorhandler(HTTPStatus.NOT_FOUND)
def page_not_found(e):
    return render_template("errors/404.html")


if __name__ == "__main__":
    app.run()
