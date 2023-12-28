import unittest
from app import app
from http import HTTPStatus


class BasicTestCase(unittest.TestCase):
    def test_home(self):
        tester = app.test_client(self)
        response = tester.get("/", content_type="html/text")
        self.assertEqual(response.status_code, HTTPStatus.OK)


if __name__ == "__main__":
    unittest.main()
