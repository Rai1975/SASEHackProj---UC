import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import requests
from twilio_controller.affirmation_generation import generate_affirmation
import psycopg

load_dotenv()

app = Flask(__name__)
CORS(app)

SUPABASE_URL = os.environ.get("SUPABASE_URL")

def result_to_dict(cursor, result):
    columns = [desc[0] for desc in cursor.description]
    return [dict(zip(columns, row)) for row in result]

#USER CREATE
@app.route('/user', methods = ['POST'])
def create_user():
    data = request.get_json()

    username = data.get('username')
    if not username: 
        return jsonify({'error': 'username is required'}), 400
    
    sql = 'INSERT INTO "User" (username) VALUES (%s) RETURNING *'

    try: 
        with psycopg.connect(SUPABASE_URL) as conn: 
            with conn.cursor() as cur: 
                cur.execute(sql, (username,))
                new_user = cur.fetchall()
                conn.commit()
                return jsonify(result_to_dict(cur, new_user))
    except Exception as e: 
        return jsonify({'error': str(e)}), 500

#USER READ
@app.route('/user/<int:user_id>',methods = ['GET'])
def get_user(user_id): 
    sql = 'SELECT * FROM "User" WHERE id = %s'
    try: 
        with psycopg.connect(SUPABASE_URL) as conn: 
            with conn.cursor() as cur: 
                cur.execute(sql, (user_id,))
                user = cur.fetchall()
                if not user: 
                    return jsonify({"message": "User not found"}), 404
                return jsonify(result_to_dict(cur, user)[0])
    except Exception as e: 
        return jsonify({'error': str(e)}), 500


#USER UPDATE
@app.route('/user/update_user',methods = ['POST'])
def update_user(): 
    data = request.get_json()
    user_id = data.get('user_id')
    username = data.get('username')
    if not user_id or not username:
        return jsonify({"error": "user_id and username are required"}), 400

    sql = 'UPDATE "User" SET username = %s WHERE id = %s RETURNING *'
    try:
        with psycopg.connect(SUPABASE_URL) as conn:
            with conn.cursor() as cur:
                cur.execute(sql, (username, user_id))
                updated_user = cur.fetchall()
                conn.commit()
                if not updated_user:
                    return jsonify({"message": "User not found"}), 404
                return jsonify(result_to_dict(cur, updated_user)[0]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# USER DELETE
@app.route('/user/delete_user', methods = ['POST'])
def delete_user():
    data = request.get_json()
    user_id = data.get('user_id')

    if not user_id:
        return jsonify({"error": "user_id is required"}), 400

    sql = 'DELETE FROM "User" WHERE id = %s'
    try:
        with psycopg.connect(SUPABASE_URL) as conn:
            with conn.cursor() as cur:
                cur.execute(sql, (user_id,))
                # cur.rowcount will be 1 if a row was deleted, 0 otherwise
                if cur.rowcount == 0:
                    return jsonify({"message": "User not found"}), 404
                conn.commit()
                return jsonify({"message": f"User with id {user_id} deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/call_logs/by_date', methods=['GET'])
def get_call_by_date():
    date = request.args.get('date')

    if not date:
        return jsonify({"error": "Missing 'date' query parameter"}), 400

    query = '''
        SELECT uc.raw_text, ci.insight, uc.created_at
        FROM "User_Call" uc
        JOIN "Call_Insights" ci ON uc.id = ci.call_id
        WHERE DATE(uc.created_at) = %s
    '''

    try:
        conn = psycopg.connect(os.getenv('SUPABASE_URL'), options="-c prepare_threshold=0")
        cur = conn.cursor()

        cur.execute(query, (date,))
        rows = cur.fetchall()

        # Format as JSON-friendly structure
        entries = [{"raw_text": row[0], "insight": row[1], "created_at": row[2]} for row in rows]

        return jsonify({"entries": entries})

    except Exception as e:
        print(f"Error connecting or querying Supabase: {e}")
        return jsonify({"error": "Database query failed"}), 500

    finally:
        if 'cur' in locals() and cur:
            cur.close()
        if 'conn' in locals() and conn:
            conn.close()

@app.route('/stimulus/emotion-mapping', methods=['GET'])
def get_emotion_mappings():
    query = '''
        SELECT name, created_at, anger, fear, joy, love, sadness, surprise, id
        FROM "Stimuli"
        ORDER BY name, created_at
    '''

    try:
        conn = psycopg.connect(
            os.getenv('SUPABASE_URL'),
            options="-c prepare_threshold=0"
        )
        cur = conn.cursor()
        cur.execute(query)
        rows = cur.fetchall()

        # Group by stimulus name
        result = {}
        for row in rows:
            name, created_at, anger, fear, joy, love, sadness, surprise, id = row

            entry = {
                "created_at": created_at.isoformat() if created_at else None,
                "emotions": {
                    "anger": anger,
                    "fear": fear,
                    "joy": joy,
                    "love": love,
                    "sadness": sadness,
                    "surprise": surprise,
                },
                "stim_id": id
            }

            if name not in result:
                result[name] = []
            result[name].append(entry)

        return jsonify(result)

    except Exception as e:
        print(f"Error connecting or querying Supabase: {e}")
        return jsonify({"error": "Database query failed"}), 500

    finally:
        if 'cur' in locals() and cur:
            cur.close()
        if 'conn' in locals() and conn:
            conn.close()

@app.route('/insight/get-by-stim-id', methods=['GET'])
def get_insight_by_id():
    stim_id = request.args.get('id')

    if not stim_id:
        return jsonify({"error": "Missing 'id' query parameter"}), 400

    query = '''
        SELECT ci.created_at, ci.insight
        FROM "Call_Insights" ci
        JOIN "Stim_Insight" si ON ci.id = si.insight_id
        WHERE si.stim_id = %s
        ORDER BY ci.created_at
    '''

    try:
        conn = psycopg.connect(os.getenv('SUPABASE_URL'), options="-c prepare_threshold=0")
        cur = conn.cursor()

        cur.execute(query, (stim_id,))
        rows = cur.fetchall()

        # Format as JSON-friendly structure
        entries = [
            {
                "created_at": row[0].isoformat() if row[0] else None,
                "insight": row[1]
            }
            for row in rows
        ]

        return jsonify({"entries": entries})

    except Exception as e:
        print(f"Error connecting or querying Supabase: {e}")
        return jsonify({"error": "Database query failed"}), 500

    finally:
        if 'cur' in locals() and cur:
            cur.close()
        if 'conn' in locals() and conn:
            conn.close()

@app.route('/get-todays-affirmation', methods=['GET'])
def get_affirmation():
    affirmation = generate_affirmation()

    return jsonify({"affirmation": affirmation})

if __name__ == '__main__':
    app.run(debug=True, port=8080)