"""Список всех пользователей и их статистика."""
import json
import os
import psycopg2
import psycopg2.extras

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
}


def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    try:
        cur.execute("""
            SELECT
              u.id, u.name, u.email, u.created_at,
              COUNT(k.id) AS kp_count,
              MAX(k.created_at) AS last_kp_at,
              SUM(k.total) AS total_sum
            FROM users u
            LEFT JOIN kp_history k ON k.user_id = u.id
            GROUP BY u.id, u.name, u.email, u.created_at
            ORDER BY u.created_at DESC
        """)
        rows = cur.fetchall()
        result = []
        for r in rows:
            entry = dict(r)
            entry['created_at'] = str(entry['created_at'])
            entry['last_kp_at'] = str(entry['last_kp_at']) if entry['last_kp_at'] else None
            entry['kp_count'] = int(entry['kp_count'])
            entry['total_sum'] = float(entry['total_sum']) if entry['total_sum'] else 0
            result.append(entry)
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps(result)}
    finally:
        cur.close()
        conn.close()
