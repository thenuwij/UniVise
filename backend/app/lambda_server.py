# AWS Lambda Web Adapter (LWA) entrypoint.
#
# Instead of Mangum (which buffers responses), this runs the app as a REAL
# uvicorn HTTP server inside Lambda — just like ECS. The Lambda Web Adapter, a
# Lambda extension at /opt/extensions/lambda-adapter, bridges Lambda's Runtime
# API to this local server. Because the path is genuine HTTP end to end,
# FastAPI's StreamingResponse streams token-by-token (RESPONSE_STREAM mode).
#
# Secrets are still fetched from Secrets Manager on startup (same as before),
# then exposed as env vars before the app is imported by uvicorn.
import os
import sys

# Put the backend root (/var/task) on sys.path so BOTH the `app.*` imports and
# the routers' bare `from dependencies import ...` resolve — dependencies.py
# lives at the backend root, next to the app/ package. Self-locating via
# __file__ so it works however the script is launched.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import boto3  # installed in the Lambda image (the slim base lacks it)

_SECRETS = {
    "SUPABASE_SERVICE_ROLE_KEY": "univise/staging/supabase-service-role-key",
    "OPENAI_API_KEY": "univise/staging/openai-api-key",
    "ANTHROPIC_API_KEY": "univise/staging/anthropic-api-key",
}


def _load_secrets() -> None:
    client = None  # created lazily — skipped when all secrets are env-provided
    for env_name, secret_id in _SECRETS.items():
        if os.environ.get(env_name):
            continue
        if client is None:
            client = boto3.client("secretsmanager")
        os.environ[env_name] = client.get_secret_value(SecretId=secret_id)["SecretString"]


if __name__ == "__main__":
    _load_secrets()
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=int(os.environ.get("PORT", "8080")),
    )
