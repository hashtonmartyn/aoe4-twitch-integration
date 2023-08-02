import dataclasses
from json import loads

from redis import asyncio as aioredis
import httpx
from authlib.integrations.base_client import OAuthError
from authlib.integrations.starlette_client import OAuth
from fastapi import FastAPI, HTTPException
from redis.commands.json.path import Path
from starlette.middleware.cors import CORSMiddleware
from starlette.responses import RedirectResponse, JSONResponse
from starlette.middleware.sessions import SessionMiddleware
from starlette.requests import Request
from fastapi_csrf_protect import CsrfProtect
from pydantic import BaseModel
from os.path import dirname, realpath, pardir, join, abspath
from loguru import logger


def get_twitch_client_secret() -> str:
    secret_path = abspath(join(dirname(realpath(__file__)), pardir, "twitch_client_secret"))
    with open(secret_path) as fin:
        return fin.read()


TWITCH_CLIENT_ID = "j14afo5k3gvebt6sytw7p7t5o8syyg"
TWITCH_CLIENT_SECRET = get_twitch_client_secret()

httpx_transport = None  # Should only be used for testing, no other reason to set this


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


redis = aioredis.from_url("redis://localhost")


class Poll(BaseModel):
    result: str
    event_id: str


@app.get("/login/twitch")
async def login_via_twitch(request: Request):
    redirect_uri = request.url_for("auth_via_twitch")
    resp = await oauth.twitch.authorize_redirect(request, redirect_uri=redirect_uri)
    return resp


@app.get("/auth/twitch")
async def auth_via_twitch(request: Request):
    try:
        token = await oauth.twitch.authorize_access_token(
            request,
            client_id=TWITCH_CLIENT_ID,
            client_secret=TWITCH_CLIENT_SECRET,
            grant_type="authorization_code"
        )
    except OAuthError as err:
        logger.error("Failed to authenticate user, error: ", err)
        error_name = request.query_params.get("error", "unknown_error")
        error_description = request.query_params.get("error_description", "no_error_description")

        return RedirectResponse(
            f"http://localhost:5173/TwitchAuth?error={error_name}&error_description={error_description}",
        )

    access_token = token["access_token"]

    async with httpx.AsyncClient(transport=httpx_transport) as client:
        twitch_user_response = await client.get(
            "https://api.twitch.tv/helix/users",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Client-Id": TWITCH_CLIENT_ID
            }
        )
    twitch_user_response.raise_for_status()
    twitch_user_response_data = twitch_user_response.json()

    display_name = twitch_user_response_data["data"][0]["display_name"]
    broadcaster_id = twitch_user_response_data["data"][0]["id"]

    request.session["twitch_access_token"] = access_token
    request.session["display_name"] = display_name
    request.session["broadcaster_id"] = broadcaster_id

    return RedirectResponse("http://localhost:5173/TwitchAuth")


@app.get("/twitch_session_data")
async def twitch_session_data(request: Request):
    access_token = request.session.get("twitch_access_token")
    broadcaster_id = request.session.get("broadcaster_id")
    if not access_token or not broadcaster_id:
        raise HTTPException(status_code=404, detail="Missing data from the user's session")

    return JSONResponse(
        content={
            "access_token": access_token,
            "broadcaster_id": broadcaster_id
        }
    )


@app.post("/poll_result")
async def poll_result(request: Request, poll: Poll):
    broadcaster_id = request.session.get("display_name")
    if not broadcaster_id:
        raise HTTPException(status_code=404, detail="Missing data from the user's session")

    data = poll.json()
    await redis.set(broadcaster_id, data)


@app.get("/poll_result/{display_name}")
async def poll_result(display_name: str):
    raw_result = await redis.get(display_name)

    if not raw_result:
        raise HTTPException(status_code=404, detail="No poll result found")

    result = loads(raw_result)

    return result
