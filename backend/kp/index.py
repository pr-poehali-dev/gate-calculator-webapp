"""Сохранение и получение истории КП."""
import json
import os
import psycopg2
import psycopg2.extras

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
}


def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    try:
        if method == 'POST':
            body = json.loads(event.get('body') or '{}')
            user_id = body.get('user_id')
            kp = body.get('kp', {})

            cur.execute("""
                INSERT INTO kp_history
                  (user_id, rnk, gate_type, gate_w, gate_h, fill_type, has_wicket,
                   wicket_w, wicket_h, auto_label, fill_label, total,
                   gate_area, wicket_area, extras, payload)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                RETURNING id, created_at
            """, (
                user_id,
                kp.get('rnk'), kp.get('gateType'), kp.get('gateW'), kp.get('gateH'),
                kp.get('fillType'), kp.get('hasWicket'),
                kp.get('wicketW'), kp.get('wicketH'),
                kp.get('autoLabel'), kp.get('fillLabel'), kp.get('total'),
                kp.get('gateArea'), kp.get('wicketArea'),
                kp.get('extras', []),
                json.dumps(kp)
            ))
            row = cur.fetchone()
            conn.commit()
            return {
                'statusCode': 200, 'headers': CORS,
                'body': json.dumps({'id': row['id'], 'created_at': str(row['created_at'])})
            }

        else:
            # GET — список всех КП с именами пользователей
            cur.execute("""
                SELECT
                  k.id, k.rnk, k.gate_type, k.gate_w, k.gate_h,
                  k.fill_type, k.has_wicket, k.wicket_w, k.wicket_h,
                  k.auto_label, k.fill_label, k.total,
                  k.gate_area, k.wicket_area, k.extras,
                  k.payload, k.created_at,
                  u.id as user_id, u.name as user_name, u.email as user_email
                FROM kp_history k
                LEFT JOIN users u ON k.user_id = u.id
                ORDER BY k.created_at DESC
                LIMIT 200
            """)
            rows = cur.fetchall()
            result = []
            for r in rows:
                entry = dict(r)
                entry['created_at'] = str(entry['created_at'])
                entry['total'] = float(entry['total']) if entry['total'] else 0
                entry['gate_area'] = float(entry['gate_area']) if entry['gate_area'] else 0
                entry['wicket_area'] = float(entry['wicket_area']) if entry['wicket_area'] else 0
                result.append(entry)
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps(result)}

    finally:
        cur.close()
        conn.close()
