"""Регистрация и вход пользователей калькулятора ворот."""
import json
import os
import hashlib
import psycopg2

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
}


def hash_pass(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    body = json.loads(event.get('body') or '{}')
    action = body.get('action')  # 'register' | 'login'
    email = (body.get('email') or '').strip().lower()
    password = body.get('password') or ''
    name = (body.get('name') or '').strip()

    if not email or not password:
        return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Email и пароль обязательны'})}

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()

    try:
        if action == 'register':
            if not name:
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Укажите имя'})}
            cur.execute(
                "INSERT INTO users (name, email, password) VALUES (%s, %s, %s) RETURNING id, name, email, created_at",
                (name, email, hash_pass(password))
            )
            row = cur.fetchone()
            conn.commit()
            return {
                'statusCode': 200, 'headers': CORS,
                'body': json.dumps({'id': row[0], 'name': row[1], 'email': row[2], 'created_at': str(row[3])})
            }

        elif action == 'login':
            cur.execute("SELECT id, name, email, created_at FROM users WHERE email=%s AND password=%s",
                        (email, hash_pass(password)))
            row = cur.fetchone()
            if not row:
                return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Неверный email или пароль'})}
            return {
                'statusCode': 200, 'headers': CORS,
                'body': json.dumps({'id': row[0], 'name': row[1], 'email': row[2], 'created_at': str(row[3])})
            }

        else:
            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Неизвестное действие'})}

    except psycopg2.errors.UniqueViolation:
        conn.rollback()
        return {'statusCode': 409, 'headers': CORS, 'body': json.dumps({'error': 'Email уже зарегистрирован'})}
    finally:
        cur.close()
        conn.close()
