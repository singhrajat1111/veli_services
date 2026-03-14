import asyncio
from database import engine
from sqlalchemy import text

async def test():
    async with engine.connect() as conn:
        result = await conn.execute(text(
            "SELECT indexname, indexdef FROM pg_indexes "
            "WHERE schemaname = 'app' AND tablename = 'recommendations'"
        ))
        rows = result.fetchall()
        if not rows:
            print("No indexes found on app.recommendations")
        for row in rows:
            print(row)

asyncio.run(test())
