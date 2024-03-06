from flask import render_template, request, abort, jsonify, url_for
from http import HTTPStatus
from dotenv import load_dotenv
from playwright.sync_api import sync_playwright

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


def handle_dowload(download):
    print(f"Download {download.suggested_filename} started")
    # Wait for the download process to complete and save the downloaded file somewhere
    download.save_as("./" + download.suggested_filename)


@app.post("/bg")
def bg():
    """
    Captures an animation and generates a background image of a map using provided map form data.
    This endpoint expects a JSON payload with map form data, which includes:

    - `locations`: Array of objects, each containing:
      - `id`: Unique identifier for the location.
      - `address`: Physical address.
      - `arrival`: Arrival time at the location.
      - `departure`: Departure time from the location.
      - `coordinates`: Geographical coordinates as a string.
      - `images`: Array of associated image files.
    - `tileSrc`: URL for the map tile source.

    Returns:
        An empty response with a 200 OK status code if valid data received, else 400.
    """
    map_form_data = request.json
    if not map_form_data["locations"]:
        return "", HTTPStatus.BAD_REQUEST

    print("Getting Screenshot")
    with sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context(viewport={"width": 7200, "height": 5400})
        page = context.new_page()
        page.on("console", lambda msg: print(msg.text))

        page.goto(url_for("map", _external=True))
        page.evaluate(
            "(mapFormData) => window.prepForScreenshot(mapFormData);", map_form_data
        )
        page.wait_for_timeout(15000)
        page.screenshot(path="HEMLO.png")
        browser.close()

    print("Getting animation")
    with sync_playwright() as p:
        browser = p.chromium.launch(downloads_path="./")
        context = browser.new_context(accept_downloads=True)
        page = context.new_page()
        page.on("console", lambda msg: print(msg.text))
        with page.expect_download(
            timeout=len(map_form_data["locations"]) * 15000 + 10000
        ) as download_info:
            page.goto(url_for("map", _external=True))
            page.evaluate(
                "(mapFormData) => window.getAnimation(mapFormData);", map_form_data
            )
            download_info.value.save_as(download_info.value.suggested_filename)
            download_info.value.delete()

        print("All done")
        browser.close()

    return "", HTTPStatus.OK


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


@app.get("/printify/<resource>")
def printify(resource):
    from .utils.pod import Printify

    if resource == "shops":
        return Printify.get_shops()
    elif resource == "blueprints":
        return Printify.get_blueprints()
    else:
        abort(HTTPStatus.BAD_REQUEST)


if __name__ == "__main__":
    app.run()
