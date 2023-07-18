from fastapi import FastAPI, Depends
from starlette.middleware.cors import CORSMiddleware
from starlette.responses import JSONResponse
from starlette.middleware.sessions import SessionMiddleware
from starlette.requests import Request
from authlib.integrations.starlette_client import OAuth
from fastapi_csrf_protect import CsrfProtect
from pydantic import BaseModel


class CsrfSettings(BaseModel):
    secret_key: str = "asecrettoeverybody"
    cookie_samesite: str = "none"
    cookie_secure: bool = True


@CsrfProtect.load_config
def get_csrf_config():
    return CsrfSettings()


app = FastAPI()
app.add_middleware(SessionMiddleware, secret_key="some-random-string", same_site="none")
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
    client_secret="REPLACE THIS",
    client_kwargs={"scope": "channel:manage:polls"},
    scope="channel:manage:polls",
    redirect_uri="http://localhost:8000/auth/twitch",
    authorize_url="https://id.twitch.tv/oauth2/authorize",
    response_type="token",
)


@app.get("/login/twitch")
async def login_via_twitch(request: Request):
    redirect_uri = request.url_for("auth_via_twitch")
    resp = await oauth.twitch.authorize_redirect(request, redirect_uri=redirect_uri)
    return resp


@app.get("/auth/twitch")
async def auth_via_twitch(request: Request):
    print(request.url)
    status_code = 200
    token = await oauth.twitch.authorize_access_token(request)
    user = token["userinfo"]
    content = dict(user)

    response = JSONResponse(status_code=status_code, content=content)

    return response


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
