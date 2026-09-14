# Lambda container image using the AWS Lambda Web Adapter (LWA).
#
# Unlike a Mangum image, this runs the app as a REAL uvicorn HTTP server inside
# Lambda (same as ECS). The adapter — copied into /opt/extensions — bridges
# Lambda's Runtime API to that server, so FastAPI's StreamingResponse streams
# token-by-token. Using the slim base (not the Lambda base image) is required:
# LWA owns the Runtime API, so we must not also run the Lambda runtime client.
FROM public.ecr.aws/awsguru/aws-lambda-adapter:0.9.0 AS adapter

FROM python:3.12-slim

# The adapter auto-runs as a Lambda extension from this exact path.
COPY --from=adapter /lambda-adapter /opt/extensions/lambda-adapter

WORKDIR /var/task

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
# boto3 (for the startup secrets fetch) — the slim base doesn't include it,
# whereas the old Lambda base image did.
RUN pip install --no-cache-dir boto3

# Whole backend dir, so root-level dependencies.py sits beside the app/ package
# (same as the ECS image's `COPY . .`).
COPY . .

# LWA config: stream responses, check readiness on /health, app listens on 8080.
ENV AWS_LWA_INVOKE_MODE=response_stream
ENV AWS_LWA_READINESS_CHECK_PATH=/health
ENV PORT=8080

# Load secrets, then start the real uvicorn server.
CMD ["python", "app/lambda_server.py"]
