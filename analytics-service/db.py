import psycopg2
from psycopg2.extras import RealDictCursor

DB_CONFIG = {
    "dbname": "localconnect_db",
    "user": "analytics_reader",
    "password": "analytics_reader_pass",
    "host": "localhost",
    "port": "5432"
}

def get_db_connection():
    return psycopg2.connect(**DB_CONFIG, cursor_factory=RealDictCursor)
