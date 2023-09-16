import os
from json import loads

from oauthlib.oauth2 import OAuth2Token
from redis import asyncio as aioredis
import httpx
from authlib.integrations.base_client import OAuthError
from authlib.integrations.starlette_client import OAuth
from fastapi import FastAPI, HTTPException
from starlette.middleware.cors import CORSMiddleware
from starlette.responses import RedirectResponse, JSONResponse
from starlette.middleware.sessions import SessionMiddleware
from starlette.requests import Request
from fastapi_csrf_protect import CsrfProtect
from pydantic import BaseModel
from loguru import logger


TWITCH_CLIENT_ID = "j14afo5k3gvebt6sytw7p7t5o8syyg"
TWITCH_CLIENT_SECRET = os.environ["TWITCH_CLIENT_SECRET"]
CSRF_SECRET_KEY = os.environ["CSRF_SECRET_KEY"]
SESSION_SECRET_KEY = os.environ["SESSION_SECRET_KEY"]

httpx_transport = None  # Should only be used for testing, no other reason to set this


class CsrfSettings(BaseModel):
    secret_key: str = CSRF_SECRET_KEY
    cookie_samesite: str = "none"
    cookie_secure: bool = True


@CsrfProtect.load_config
def get_csrf_config():
    return CsrfSettings()


app = FastAPI()
app.add_middleware(SessionMiddleware, secret_key=SESSION_SECRET_KEY, same_site="lax", https_only=True)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://aoe4ti.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def update_token(name, token, refresh_token=None, access_token=None):
    if refresh_token:
        item = OAuth2Token.find(name=name, refresh_token=refresh_token)
    elif access_token:
        item = OAuth2Token.find(name=name, access_token=access_token)
    else:
        return

    # update old token
    item.access_token = token['access_token']
    item.refresh_token = token.get('refresh_token')
    item.expires_at = token['expires_at']
    item.save()


oauth = OAuth(update_token=update_token)
oauth.register(
    "twitch",
    client_id="j14afo5k3gvebt6sytw7p7t5o8syyg",
    client_secret=TWITCH_CLIENT_SECRET,
    client_kwargs={"scope": "channel:manage:polls"},
    scope="channel:manage:polls",
    redirect_uri="https://aoe4ti-backend.fly.dev/login/twitch",
    authorize_url="https://id.twitch.tv/oauth2/authorize",
    token_endpoint="https://id.twitch.tv/oauth2/token",
    response_type="code",
)


redis = aioredis.from_url("redis://default:7d10478ab2cc42fc9203752f5e3c859b@fly-aoe4ti-backend-redis.upstash.io")


class Poll(BaseModel):
    result: str
    event_id: str


@app.get("/healthcheck")
def read_root():
    return {"status": "ok"}


@app.get("/login/twitch")
async def login_via_twitch(request: Request):
    redirect_uri = request.url_for("auth_via_twitch").replace(scheme="https")
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
        logger.error("Failed to authenticate user")
        logger.exception(err)
        error_name = request.query_params.get("error", "unknown_error")
        error_description = request.query_params.get("error_description", "no_error_description")

        return RedirectResponse(
            f"https://aoe4ti.com/TwitchAuth?error={error_name}&error_description={error_description}",
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

    return RedirectResponse("https://aoe4ti.com/TwitchAuth")


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
    await redis.set(broadcaster_id, data, ex=180)


@app.get("/poll_result/{display_name}")
async def poll_result(display_name: str):
    raw_result = await redis.get(display_name)

    if not raw_result:
        raise HTTPException(status_code=404, detail="No poll result found")

    result = loads(raw_result)

    return result
