FROM python:3.11.5-slim-bookworm

ENV PYTHONUNBUFFERED True
ENV APP_HOME /app
WORKDIR $APP_HOME

RUN apt-get update && apt-get upgrade && pip install poetry

COPY poetry.lock ./
COPY pyproject.toml ./

RUN poetry export --format=requirements.txt > requirements.txt && \
    pip install -r requirements.txt

COPY backend/main.py ./

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]