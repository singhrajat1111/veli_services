from collections.abc import AsyncGenerator
from urllib.parse import unquote, urlparse

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from config import settings


# Parse the Supabase URL manually to preserve dotted usernames
# (e.g. "postgres.project-ref") which drivers mishandle in URL form.
_parsed = urlparse(settings.supabase_db_url)
_user = unquote(_parsed.username or "")
_password = unquote(_parsed.password or "")
_host = _parsed.hostname or ""
_port = _parsed.port or 5432
_dbname = (_parsed.path or "/postgres").lstrip("/")

engine = create_async_engine(
    "postgresql+psycopg://",
    pool_size=10,
    max_overflow=20,
    connect_args={
        "user": _user,
        "password": _password,
        "host": _host,
        "port": _port,
        "dbname": _dbname,
    },
)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session
