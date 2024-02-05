from flask import render_template, request, abort, jsonify
from http import HTTPStatus
from dotenv import load_dotenv
import random

from .utils.flasklambda import FlaskLambda
from .utils.mapbox import get_geocoded_suggestions


load_dotenv()
app = FlaskLambda(__name__)


@app.route("/")
def base():
    return render_template("index.html")


@app.post("/get-address-suggestions")
def get_address_suggestions():
    data = request.json
    address = data.get("address")
    if not address:
        abort(HTTPStatus.BAD_REQUEST, description="No address supplied")

    suggestions = get_geocoded_suggestions_temp(address)

    return jsonify(suggestions), HTTPStatus.OK


def get_random_lat_long():
    """
    Returns a random latitude and longitude as a tuple (float, float).
    """
    lat = random.uniform(-90, 90)  # Random between -90 and 90 degrees # nosec B311
    lon = random.uniform(-180, 180)  # Random between -180 and 180 degrees # nosec B311

    return (lat, lon)


def get_geocoded_suggestions_temp(address):
    suggestions = [
        {
            "place_name": address,
            "center": get_random_lat_long(),
        }
    ]
    return suggestions


@app.errorhandler(HTTPStatus.NOT_FOUND)
def page_not_found(e):
    return render_template("errors/404.html")


@app.errorhandler(HTTPStatus.BAD_REQUEST)
def bad_request(e):
    return jsonify(error=str(e)), HTTPStatus.BAD_REQUEST


if __name__ == "__main__":
    app.run()
