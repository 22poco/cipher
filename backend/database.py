import psycopg

from .config import settings


def check_database_connection() -> bool:
    try:
        with psycopg.connect(settings.database_url, connect_timeout=5) as connection:
            with connection.cursor() as cursor:
                cursor.execute("select 1")
                result = cursor.fetchone()
    except psycopg.Error:
        return False

    return result == (1,)
