import os
import requests
from urllib.parse import quote


def get_geocoded_suggestions(address):
    """
    Retrieves geocoded suggestions for a given address using
    the Mapbox Geocoding API.

    Args:
        address (str): The address to geocode.

    Returns:
        list: A list of geocoded feature suggestions if the API request
        is successful and the response code is 200. Returns None if the
        request fails or if a non-200 response code is received.
    """
    MAPBOX_API_KEY = os.environ.get("MAPBOX_API_KEY")
    address = quote(address)
    url = f"https://api.mapbox.com/geocoding/v5/mapbox.places/{address}.json"
    params = {
        "access_token": MAPBOX_API_KEY,
        "types": "country,region,district,place,locality",
    }
    try:
        response = requests.get(url, params=params, timeout=15)
        if response.status_code == 200:
            return response.json().get("features")
        elif response.status_code == 429:
            print("Rate limit exceeded. Please try again later.")
        else:
            print(f"Error: {response.status_code} - {response.reason}")
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")

    return None
