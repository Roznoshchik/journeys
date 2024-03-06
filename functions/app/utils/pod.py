import os
import requests

PRINTIFY_API_KEY = os.environ.get("PRINTIFY_API_KEY")
PRINTIFY_BASE_URL = "https://api.printify.com/v1/"


class Printify:
    api_key = PRINTIFY_API_KEY
    base_url = PRINTIFY_BASE_URL

    @classmethod
    def _request(self, url, method="GET", params=None, data=None):
        headers = {
            "Authorization": "Bearer " + self.api_key,
            "Content-Type": "application/json;charset=utf-8",
            "user-agent": "Python",
        }
        res = requests.request(method, url, params=params, headers=headers, data=data)
        if res.ok:
            return res.json()
        else:
            print(f"Error fetching data from {url}: {res.status_code} {res.reason}")
            return None

    @classmethod
    def get_shops(cls):
        url = cls.base_url + "shops.json"
        return cls._request(url)

    @classmethod
    def get_blueprints(cls):
        url = cls.base_url + "catalog/blueprints.json"
        return cls._request(url)
