"""Test configuration.

The application modules build a Supabase client at import time and refuse to
start without credentials. Tests only exercise pure logic, so stub values are
enough — no network call is made when the client is constructed.
"""
import os

os.environ.setdefault("SUPABASE_URL", "https://test.supabase.co")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key")
os.environ.setdefault("OPENAI_API_KEY", "test-openai-key")
os.environ.setdefault("ANTHROPIC_API_KEY", "test-anthropic-key")
