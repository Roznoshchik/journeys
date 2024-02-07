import os
import random
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


def get_n_random_suggestions(n=2):
    """
    Returns two random entries from the suggestions array as a new array.
    If the input array has less than two elements, it returns the input array itself.
    """
    if len(suggestions) < n:
        return suggestions
    else:
        return random.sample(suggestions, n)


suggestions = [
    {
        "id": "place.31230018",
        "type": "Feature",
        "place_type": ["place"],
        "relevance": 1,
        "properties": {"mapbox_id": "dXJuOm1ieHBsYzpBZHlJUWc", "wikidata": "Q1770"},
        "text": "Tallinn",
        "place_name": "Tallinn, Harju, Estonia",
        "bbox": [24.5437116, 59.351801, 24.926282, 59.5008709],
        "center": [24.745369, 59.437216],
        "geometry": {"type": "Point", "coordinates": [24.745369, 59.437216]},
        "context": [
            {
                "id": "region.17474",
                "mapbox_id": "dXJuOm1ieHBsYzpSRUk",
                "wikidata": "Q180200",
                "short_code": "EE-37",
                "text": "Harju",
            },
            {
                "id": "country.8770",
                "mapbox_id": "dXJuOm1ieHBsYzpJa0k",
                "wikidata": "Q191",
                "short_code": "ee",
                "text": "Estonia",
            },
        ],
    },
    {
        "id": "locality.22202984",
        "type": "Feature",
        "place_type": ["locality"],
        "relevance": 0.928571,
        "properties": {"mapbox_id": "dXJuOm1ieHBsYzpBVkxLYUE"},
        "text": "Ballinn",
        "place_name": "Ballinn, Copperalley, Westmeath, Ireland",
        "bbox": [-7.0218644, 53.6034369, -6.998842, 53.6170425],
        "center": [-7.015669, 53.605955],
        "geometry": {"type": "Point", "coordinates": [-7.015669, 53.605955]},
        "context": [
            {
                "id": "place.7358568",
                "mapbox_id": "dXJuOm1ieHBsYzpjRWhv",
                "text": "Copperalley",
            },
            {
                "id": "region.148584",
                "mapbox_id": "dXJuOm1ieHBsYzpBa1Jv",
                "wikidata": "Q182633",
                "short_code": "IE-WH",
                "text": "Westmeath",
            },
            {
                "id": "country.8808",
                "mapbox_id": "dXJuOm1ieHBsYzpJbWc",
                "wikidata": "Q27",
                "short_code": "ie",
                "text": "Ireland",
            },
        ],
    },
    {
        "id": "place.77531194",
        "type": "Feature",
        "place_type": ["place"],
        "relevance": 0.928571,
        "properties": {
            "mapbox_id": "dXJuOm1ieHBsYzpCSjhJT2c",
            "wikidata": "Q654818",
        },
        "text": "Talling",
        "place_name": "Talling, Kreis Bernkastel-Wittlich, Rhineland-Palatinate, Germany",
        "bbox": [6.941574, 49.749053, 6.97666, 49.776039],
        "center": [6.953374, 49.760488],
        "geometry": {"type": "Point", "coordinates": [6.953374, 49.760488]},
        "context": [
            {
                "id": "district.214586",
                "mapbox_id": "dXJuOm1ieHBsYzpBMFk2",
                "wikidata": "Q8585",
                "text": "Kreis Bernkastel-Wittlich",
            },
            {
                "id": "region.58426",
                "mapbox_id": "dXJuOm1ieHBsYzo1RG8",
                "wikidata": "Q1200",
                "short_code": "DE-RP",
                "text": "Rhineland-Palatinate",
            },
            {
                "id": "country.8762",
                "mapbox_id": "dXJuOm1ieHBsYzpJam8",
                "wikidata": "Q183",
                "short_code": "de",
                "text": "Germany",
            },
        ],
    },
    {
        "id": "locality.505342576",
        "type": "Feature",
        "place_type": ["locality"],
        "relevance": 0.928571,
        "properties": {"mapbox_id": "dXJuOm1ieHBsYzpIaDdxY0E"},
        "text": "Tallini",
        "place_name": "Tallini, Reggello, Florence, Italy",
        "bbox": [11.5322667, 43.6700529, 11.5351852, 43.6737164],
        "center": [11.534177, 43.671425],
        "geometry": {"type": "Point", "coordinates": [11.534177, 43.671425]},
        "context": [
            {
                "id": "place.45508720",
                "mapbox_id": "dXJuOm1ieHBsYzpBclpvY0E",
                "wikidata": "Q82810",
                "text": "Reggello",
            },
            {
                "id": "region.738416",
                "mapbox_id": "dXJuOm1ieHBsYzpDMFJ3",
                "wikidata": "Q18288148",
                "short_code": "IT-FI",
                "text": "Florence",
            },
            {
                "id": "country.8816",
                "mapbox_id": "dXJuOm1ieHBsYzpJbkE",
                "wikidata": "Q38",
                "short_code": "it",
                "text": "Italy",
            },
        ],
    },
    {
        "id": "place.33929",
        "type": "Feature",
        "place_type": ["region", "place"],
        "relevance": 1,
        "properties": {
            "mapbox_id": "dXJuOm1ieHBsYzpoSWs",
            "wikidata": "Q1773",
            "short_code": "LV-RIX",
        },
        "text": "Riga",
        "place_name": "Riga, Latvia",
        "bbox": [23.93255, 56.857363, 24.324504, 57.086107],
        "center": [24.1051846, 56.9493977],
        "geometry": {"type": "Point", "coordinates": [24.1051846, 56.9493977]},
        "context": [
            {
                "id": "country.8841",
                "mapbox_id": "dXJuOm1ieHBsYzpJb2s",
                "wikidata": "Q211",
                "short_code": "lv",
                "text": "Latvia",
            }
        ],
    },
    {
        "id": "locality.469469932",
        "type": "Feature",
        "place_type": ["locality"],
        "relevance": 1,
        "properties": {"mapbox_id": "dXJuOm1ieHBsYzpHL3VLN0E"},
        "text": "Riga",
        "place_name": "Riga, New York, United States",
        "bbox": [-77.9510441, 43.036574, -77.818197, 43.1293354],
        "center": [-77.883898, 43.069506],
        "geometry": {"type": "Point", "coordinates": [-77.883898, 43.069506]},
        "context": [
            {
                "id": "place.60754156",
                "mapbox_id": "dXJuOm1ieHBsYzpBNThJN0E",
                "wikidata": "Q538814",
                "text": "Churchville",
            },
            {
                "id": "district.16115436",
                "mapbox_id": "dXJuOm1ieHBsYzo5ZWJz",
                "wikidata": "Q115104",
                "text": "Monroe County",
            },
            {
                "id": "region.107756",
                "mapbox_id": "dXJuOm1ieHBsYzpBYVRz",
                "wikidata": "Q1384",
                "short_code": "US-NY",
                "text": "New York",
            },
            {
                "id": "country.8940",
                "mapbox_id": "dXJuOm1ieHBsYzpJdXc",
                "wikidata": "Q30",
                "short_code": "us",
                "text": "United States",
            },
        ],
    },
    {
        "id": "place.277850348",
        "type": "Feature",
        "place_type": ["place"],
        "relevance": 1,
        "properties": {"mapbox_id": "dXJuOm1ieHBsYzpFSStvN0E"},
        "text": "Riga",
        "place_name": "Riga, Michigan, United States",
        "bbox": [-83.844814, 41.758748, -83.6889861, 41.836287],
        "center": [-83.82494, 41.809216],
        "geometry": {"type": "Point", "coordinates": [-83.82494, 41.809216]},
        "context": [
            {
                "id": "district.13412076",
                "mapbox_id": "dXJuOm1ieHBsYzp6S2Jz",
                "wikidata": "Q167565",
                "text": "Lenawee County",
            },
            {
                "id": "region.9452",
                "mapbox_id": "dXJuOm1ieHBsYzpKT3c",
                "wikidata": "Q1166",
                "short_code": "US-MI",
                "text": "Michigan",
            },
            {
                "id": "country.8940",
                "mapbox_id": "dXJuOm1ieHBsYzpJdXc",
                "wikidata": "Q30",
                "short_code": "us",
                "text": "United States",
            },
        ],
    },
    {
        "id": "place.63121447",
        "type": "Feature",
        "place_type": ["place"],
        "relevance": 1,
        "properties": {
            "mapbox_id": "dXJuOm1ieHBsYzpBOE1vSnc",
            "wikidata": "Q3431913",
        },
        "text": "Rigaud",
        "place_name": "Rigaud, Quebec, Canada",
        "bbox": [-74.4213767, 45.4300058, -74.2068923, 45.5313658],
        "center": [-74.301961, 45.479448],
        "geometry": {"type": "Point", "coordinates": [-74.301961, 45.479448]},
        "context": [
            {
                "id": "district.1590823",
                "mapbox_id": "dXJuOm1ieHBsYzpHRVlu",
                "wikidata": "Q1517624",
                "text": "Vaudreuil-Soulanges Regional County Municipality",
            },
            {
                "id": "region.9255",
                "mapbox_id": "dXJuOm1ieHBsYzpKQ2M",
                "wikidata": "Q176",
                "short_code": "CA-QC",
                "text": "Quebec",
            },
            {
                "id": "country.8743",
                "mapbox_id": "dXJuOm1ieHBsYzpJaWM",
                "wikidata": "Q16",
                "short_code": "ca",
                "text": "Canada",
            },
        ],
    },
    {
        "id": "place.66488538",
        "type": "Feature",
        "place_type": ["place"],
        "relevance": 1,
        "properties": {"mapbox_id": "dXJuOm1ieHBsYzpBL2FJMmc"},
        "text": "Rigaye",
        "place_name": "Rigaye, Bahr el Gazel, Chad",
        "center": [15.6897666, 13.8380668],
        "geometry": {"type": "Point", "coordinates": [15.6897666, 13.8380668]},
        "context": [
            {
                "id": "region.17626",
                "mapbox_id": "dXJuOm1ieHBsYzpSTm8",
                "wikidata": "Q1050621",
                "short_code": "TD-BG",
                "text": "Bahr el Gazel",
            },
            {
                "id": "country.8922",
                "mapbox_id": "dXJuOm1ieHBsYzpJdG8",
                "wikidata": "Q657",
                "short_code": "td",
                "text": "Chad",
            },
        ],
    },
    {
        "id": "place.296071",
        "type": "Feature",
        "place_type": ["region", "place"],
        "relevance": 1,
        "properties": {
            "mapbox_id": "dXJuOm1ieHBsYzpCSVNI",
            "wikidata": "Q216",
            "short_code": "LT-57",
        },
        "text": "Vilnius",
        "place_name": "Vilnius, Lithuania",
        "bbox": [25.024892, 54.567674, 25.479471, 54.831871],
        "center": [25.2829111, 54.6870458],
        "geometry": {"type": "Point", "coordinates": [25.2829111, 54.6870458]},
        "context": [
            {
                "id": "country.8839",
                "mapbox_id": "dXJuOm1ieHBsYzpJb2M",
                "wikidata": "Q37",
                "short_code": "lt",
                "text": "Lithuania",
            }
        ],
    },
    {
        "id": "region.17543",
        "type": "Feature",
        "place_type": ["region"],
        "relevance": 1,
        "properties": {
            "mapbox_id": "dXJuOm1ieHBsYzpSSWM",
            "wikidata": "Q118903",
            "short_code": "LT-58",
        },
        "text": "Vilnius District",
        "place_name": "Vilnius District, Lithuania",
        "bbox": [24.851736, 54.462728, 25.761932, 55.046397],
        "center": [25.599848, 54.754586],
        "geometry": {"type": "Point", "coordinates": [25.599848, 54.754586]},
        "context": [
            {
                "id": "country.8839",
                "mapbox_id": "dXJuOm1ieHBsYzpJb2M",
                "wikidata": "Q37",
                "short_code": "lt",
                "text": "Lithuania",
            }
        ],
    },
    {
        "id": "place.3631239",
        "type": "Feature",
        "place_type": ["place"],
        "relevance": 0.928571,
        "properties": {"mapbox_id": "dXJuOm1ieHBsYzpOMmlI"},
        "text": "Vilniaus",
        "place_name": "Vilniaus, Vilnius District, Lithuania",
        "bbox": [25.187242, 54.839348, 25.692693, 55.046397],
        "center": [25.42391, 54.907755],
        "geometry": {"type": "Point", "coordinates": [25.42391, 54.907755]},
        "context": [
            {
                "id": "region.17543",
                "mapbox_id": "dXJuOm1ieHBsYzpSSWM",
                "wikidata": "Q118903",
                "short_code": "LT-58",
                "text": "Vilnius District",
            },
            {
                "id": "country.8839",
                "mapbox_id": "dXJuOm1ieHBsYzpJb2M",
                "wikidata": "Q37",
                "short_code": "lt",
                "text": "Lithuania",
            },
        ],
    },
    {
        "id": "place.429025461",
        "type": "Feature",
        "place_type": ["place"],
        "relevance": 1,
        "properties": {"mapbox_id": "dXJuOm1ieHBsYzpHWkpvdFE", "wikidata": "Q270"},
        "text": "Warszawa",
        "place_name": "Warszawa, Masovian Voivodeship, Poland",
        "matching_text": "Warsaw",
        "matching_place_name": "Warsaw, Masovian Voivodeship, Poland",
        "bbox": [20.8521725, 52.0974674, 21.2720624, 52.3752701],
        "center": [21.006725, 52.231958],
        "geometry": {"type": "Point", "coordinates": [21.006725, 52.231958]},
        "context": [
            {
                "id": "region.58549",
                "mapbox_id": "dXJuOm1ieHBsYzo1TFU",
                "wikidata": "Q54169",
                "short_code": "PL-14",
                "text": "Masovian Voivodeship",
            },
            {
                "id": "country.8885",
                "mapbox_id": "dXJuOm1ieHBsYzpJclU",
                "wikidata": "Q36",
                "short_code": "pl",
                "text": "Poland",
            },
        ],
    },
    {
        "id": "place.345065708",
        "type": "Feature",
        "place_type": ["place"],
        "relevance": 1,
        "properties": {"mapbox_id": "dXJuOm1ieHBsYzpGSkZJN0E", "wikidata": "Q992560"},
        "text": "Warsaw",
        "place_name": "Warsaw, Indiana, United States",
        "bbox": [-86.00079, 41.116784, -85.698236, 41.326532],
        "center": [-85.853054, 41.238102],
        "geometry": {"type": "Point", "coordinates": [-85.853054, 41.238102]},
        "context": [
            {
                "id": "district.12592876",
                "mapbox_id": "dXJuOm1ieHBsYzp3Q2Jz",
                "wikidata": "Q506376",
                "text": "Kosciusko County",
            },
            {
                "id": "region.165100",
                "mapbox_id": "dXJuOm1ieHBsYzpBb1Rz",
                "wikidata": "Q1415",
                "short_code": "US-IN",
                "text": "Indiana",
            },
            {
                "id": "country.8940",
                "mapbox_id": "dXJuOm1ieHBsYzpJdXc",
                "wikidata": "Q30",
                "short_code": "us",
                "text": "United States",
            },
        ],
    },
    {
        "id": "place.345016556",
        "type": "Feature",
        "place_type": ["place"],
        "relevance": 1,
        "properties": {"mapbox_id": "dXJuOm1ieHBsYzpGSkNJN0E", "wikidata": "Q2026708"},
        "text": "Warsaw",
        "place_name": "Warsaw, North Carolina, United States",
        "bbox": [-78.156692, 34.883173, -77.944627, 35.077375],
        "center": [-78.091101, 34.999333],
        "geometry": {"type": "Point", "coordinates": [-78.091101, 34.999333]},
        "context": [
            {
                "id": "district.6801132",
                "mapbox_id": "dXJuOm1ieHBsYzpaOGJz",
                "wikidata": "Q511788",
                "text": "Duplin County",
            },
            {
                "id": "region.189676",
                "mapbox_id": "dXJuOm1ieHBsYzpBdVRz",
                "wikidata": "Q1454",
                "short_code": "US-NC",
                "text": "North Carolina",
            },
            {
                "id": "country.8940",
                "mapbox_id": "dXJuOm1ieHBsYzpJdXc",
                "wikidata": "Q30",
                "short_code": "us",
                "text": "United States",
            },
        ],
    },
    {
        "id": "place.345032940",
        "type": "Feature",
        "place_type": ["place"],
        "relevance": 1,
        "properties": {"mapbox_id": "dXJuOm1ieHBsYzpGSkRJN0E", "wikidata": "Q1376135"},
        "text": "Warsaw",
        "place_name": "Warsaw, Virginia, United States",
        "bbox": [-76.9393, 37.8041441, -76.619596, 38.124358],
        "center": [-76.758021, 37.958747],
        "geometry": {"type": "Point", "coordinates": [-76.758021, 37.958747]},
        "context": [
            {
                "id": "district.19867372",
                "mapbox_id": "dXJuOm1ieHBsYzpBUzhtN0E",
                "wikidata": "Q505854",
                "text": "Richmond County",
            },
            {
                "id": "region.91372",
                "mapbox_id": "dXJuOm1ieHBsYzpBV1Rz",
                "wikidata": "Q1370",
                "short_code": "US-VA",
                "text": "Virginia",
            },
            {
                "id": "country.8940",
                "mapbox_id": "dXJuOm1ieHBsYzpJdXc",
                "wikidata": "Q30",
                "short_code": "us",
                "text": "United States",
            },
        ],
    },
    {
        "id": "district.2287285",
        "type": "Feature",
        "place_type": ["district"],
        "relevance": 1,
        "properties": {"mapbox_id": "dXJuOm1ieHBsYzpJdWEx", "wikidata": "Q927212"},
        "text": "Powiat Warszawski Zachodni",
        "place_name": "Powiat Warszawski Zachodni, Masovian Voivodeship, Poland",
        "matching_text": "Warsaw West County",
        "matching_place_name": "Warsaw West County, Masovian Voivodeship, Poland",
        "bbox": [20.31232, 52.157304, 20.925825, 52.379323],
        "center": [20.843763, 52.270082],
        "geometry": {"type": "Point", "coordinates": [20.843763, 52.270082]},
        "context": [
            {
                "id": "region.58549",
                "mapbox_id": "dXJuOm1ieHBsYzo1TFU",
                "wikidata": "Q54169",
                "short_code": "PL-14",
                "text": "Masovian Voivodeship",
            },
            {
                "id": "country.8885",
                "mapbox_id": "dXJuOm1ieHBsYzpJclU",
                "wikidata": "Q36",
                "short_code": "pl",
                "text": "Poland",
            },
        ],
    },
]
