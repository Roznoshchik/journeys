import json
import os


def get_geocoded_suggestions(address):
    MAPBOX_API_KEY = os.environ.get("MAPBOX_API_KEY")
    return json.dumps({"hello": address})
