from flask import render_template, request, abort, jsonify
from http import HTTPStatus
from dotenv import load_dotenv

from .utils.flasklambda import FlaskLambda
from .utils.mapbox import get_geocoded_suggestions, get_n_random_suggestions


load_dotenv()
app = FlaskLambda(__name__)


@app.route("/")
def base():
    return render_template("index.html")


@app.route("/map")
def map():
    return render_template("map.html")


@app.post("/get-address-suggestions")
def get_address_suggestions():
    data = request.json
    address = data.get("address")
    if not address:
        abort(HTTPStatus.BAD_REQUEST, description="No address supplied")

    # suggestions = get_n_random_suggestions(n=2)
    suggestions = get_geocoded_suggestions(address)

    return jsonify(suggestions), HTTPStatus.OK


@app.errorhandler(HTTPStatus.NOT_FOUND)
def page_not_found(e):
    return render_template("errors/404.html")


@app.errorhandler(HTTPStatus.BAD_REQUEST)
def bad_request(e):
    return jsonify(error=str(e)), HTTPStatus.BAD_REQUEST


if __name__ == "__main__":
    app.run()
