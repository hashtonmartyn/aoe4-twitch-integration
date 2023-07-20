from asyncio import Future
import unittest
from unittest.mock import MagicMock

from authlib.integrations.base_client import OAuthError
from starlette.responses import RedirectResponse
from starlette.testclient import TestClient

from backend.backend.main import app, oauth


class TestAuthentication(unittest.TestCase):

    def setUp(self) -> None:
        self.client = TestClient(app)

        self.authorize_redirect_mock = MagicMock()
        self.authorize_access_token_mock = MagicMock()

        self.authorize_redirect_future = Future()
        self.authorize_access_token_future = Future()

        self.authorize_redirect_mock.return_value = self.authorize_redirect_future
        self.authorize_access_token_mock.return_value = self.authorize_access_token_future

        twitch_mock = MagicMock()
        oauth.twitch = twitch_mock
        twitch_mock.authorize_redirect = self.authorize_redirect_mock
        twitch_mock.authorize_access_token = self.authorize_access_token_mock

    def test_get_twitch_access_token_returns_404_when_not_authenticated(self):
        resp = self.client.get("/twitch_access_token")
        self.assertEqual(404, resp.status_code)

    def test_login_via_twitch_success(self):
        self.authorize_redirect_future.set_result(
            RedirectResponse(
                "/auth/twitch",
                status_code=302
            )
        )

        self.authorize_access_token_future.set_result(
            {
                "access_token": "rfx2uswqe8l4g1mkagrvg5tv0ks3",
                "expires_in": 14124,
                "refresh_token": "5b93chm6hdve3mycz05zfzatkfdenfspp1h1ar2xxdalen01",
                "scope": [
                    "channel:moderate",
                    "chat:edit",
                    "chat:read"
                ],
                "token_type": "bearer"
            }
        )

        # Can't test the redirect here because the test client doesn't allow external redirects
        self.client.get("/login/twitch")

        resp = self.client.get("/twitch_access_token")
        self.assertEqual(200, resp.status_code)

        actual = resp.json()
        expected = {
            "access_token": "rfx2uswqe8l4g1mkagrvg5tv0ks3"
        }

        self.assertEqual(actual, expected)

    def test_login_via_twitch_failure(self):
        self.authorize_redirect_future.set_result(
            RedirectResponse(
                "/auth/twitch",
                status_code=302
            )
        )

        self.authorize_access_token_future.set_exception(
            OAuthError("access_denied", "The user denied you access")
        )

        # Can't test the redirect here because the test client doesn't allow external redirects
        self.client.get("/login/twitch")

        resp = self.client.get("/twitch_access_token")
        self.assertEqual(404, resp.status_code)


if __name__ == '__main__':
    unittest.main()
