from flask import render_template
from .utils.flasklambda import FlaskLambda
from http import HTTPStatus


app = FlaskLambda(__name__)


@app.route("/")
def base():
    return render_template("index.html")


@app.errorhandler(HTTPStatus.NOT_FOUND)
def page_not_found(e):
    return render_template("errors/404.html")


if __name__ == "__main__":
    app.run()
