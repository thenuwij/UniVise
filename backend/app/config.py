import os
from dotenv import load_dotenv

# Load .env file from the project root (../backend/.env)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
dotenv_path = os.path.join(BASE_DIR, ".env")
load_dotenv(dotenv_path)

# Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
SUPABASE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# OpenAI
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Check for missing vars
REQUIRED_VARS = [
    ("SUPABASE_URL", SUPABASE_URL),
    ("SUPABASE_ANON_KEY", SUPABASE_ANON_KEY),
    ("SUPABASE_ROLE_KEY", SUPABASE_ROLE_KEY),
    ("OPENAI_API_KEY", OPENAI_API_KEY),
]

missing_vars = [name for name, value in REQUIRED_VARS if not value]
if missing_vars:
    raise EnvironmentError(
        f"Missing required environment variables: {', '.join(missing_vars)}"
    )
