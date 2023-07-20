import string
from random import choice

import httpx
from authlib.integrations.starlette_client import OAuth
from fastapi import FastAPI, HTTPException
from httpx import QueryParams
from starlette.middleware.cors import CORSMiddleware
from starlette.responses import RedirectResponse, JSONResponse
from starlette.middleware.sessions import SessionMiddleware
from starlette.requests import Request
from fastapi_csrf_protect import CsrfProtect
from pydantic import BaseModel


def get_twitch_client_secret() -> str:
    with open("twitch_client_secret") as fin:
        return fin.read()


TWITCH_CLIENT_ID = "j14afo5k3gvebt6sytw7p7t5o8syyg"
TWITCH_CLIENT_SECRET = get_twitch_client_secret()


class CsrfSettings(BaseModel):
    secret_key: str = "asecrettoeverybody"
    cookie_samesite: str = "none"
    cookie_secure: bool = True


@CsrfProtect.load_config
def get_csrf_config():
    return CsrfSettings()


app = FastAPI()
app.add_middleware(SessionMiddleware, secret_key="some-random-string", same_site="lax")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


oauth = OAuth()
oauth.register(
    "twitch",
    client_id="j14afo5k3gvebt6sytw7p7t5o8syyg",
    client_secret=get_twitch_client_secret(),
    client_kwargs={"scope": "channel:manage:polls"},
    scope="channel:manage:polls",
    redirect_uri="http://localhost:8000/login/twitch",
    authorize_url="https://id.twitch.tv/oauth2/authorize",
    token_endpoint="https://id.twitch.tv/oauth2/token",
    response_type="code",
)


@app.get("/login/twitch")
async def login_via_twitch(request: Request):
    redirect_uri = request.url_for("auth_via_twitch")

    resp = await oauth.twitch.authorize_redirect(request, redirect_uri=redirect_uri)
    return resp


@app.get("/auth/twitch")
async def auth_via_twitch(request: Request):
    print(request.url)
    token = await oauth.twitch.authorize_access_token(
        request,
        client_id=TWITCH_CLIENT_ID,
        client_secret=TWITCH_CLIENT_SECRET,
        grant_type="authorization_code"
    )

    access_token = token["access_token"]

    request.session["twitch_access_token"] = access_token

    return RedirectResponse("http://localhost:5173/TwitchAuth")


@app.get("/twitch_access_token")
async def twitch_access_token(request: Request):
    access_token = request.session.get("twitch_access_token")
    if not access_token:
        raise HTTPException(status_code=404, detail="No twitch access token found in the user's session")

    return JSONResponse(content={"access_token": access_token})
