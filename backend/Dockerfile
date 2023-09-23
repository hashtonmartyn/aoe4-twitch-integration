FROM python:3.11.5-slim-bookworm

ENV PYTHONUNBUFFERED True
ENV APP_HOME /app
WORKDIR $APP_HOME

RUN apt-get update && apt-get upgrade && pip install poetry

ENV TWITCH_CLIENT_ID=j14afo5k3gvebt6sytw7p7t5o8syyg
ENV BACKEND_URI=https://aoe4ti-backend.fly.dev
ENV FRONTEND_URI=https://aoe4ti.com
ENV FORCE_HTTPS=true
ENV REDIS_URI=redis://default:7d10478ab2cc42fc9203752f5e3c859b@fly-aoe4ti-backend-redis.upstash.io

COPY poetry.lock ./
COPY pyproject.toml ./

RUN poetry export --format=requirements.txt > requirements.txt && \
    pip install -r requirements.txt

COPY backend/main.py ./

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]

