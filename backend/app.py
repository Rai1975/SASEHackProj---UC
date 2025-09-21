import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import requests
from twilio_controller.affirmation_generation import generate_affirmation
from twilio_controller.advice_generation import parse_output
from twilio_controller.reminder_generation import generate_reminders
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
        SELECT uc.id, uc.raw_text, ci.insight, uc.created_at
        FROM "User_Call" uc
        JOIN "Call_Insights" ci ON uc.id = ci.call_id
        WHERE DATE(uc.created_at) = %s
    '''

    try:
        conn = psycopg.connect(os.getenv('SUPABASE_URL'), options="-c prepare_threshold=0")
        cur = conn.cursor()

        cur.execute(query, (date,))
        rows = cur.fetchall()

        # Format as JSON-friendly structure - now including id
        entries = [{"id": row[0], "raw_text": row[1], "insight": row[2], "created_at": row[3]} for row in rows]

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

@app.route('/get-todays-reminders', methods=['GET'])
def get_reminders():
    reminders = generate_reminders()
    return jsonify({"reminders": reminders})

@app.route('/get-todays-advice', methods=['GET'])
def get_advice():
    advice = parse_output()
    return jsonify({"advice": advice})

@app.route('/stimulus/week-top-emotions', methods=['GET'])
def get_top_emotions_of_week():
    query = '''
    SELECT
        s.name,
        COUNT(*) AS mentions,
        AVG(s.anger)   AS avg_anger,
        AVG(s.fear)    AS avg_fear,
        AVG(s.joy)     AS avg_joy,
        AVG(s.love)    AS avg_love,
        AVG(s.sadness) AS avg_sadness,
        AVG(s.surprise) AS avg_surprise
    FROM "Stimuli" s
    WHERE s.created_at >= NOW() - INTERVAL '7 days'
    GROUP BY s.name
    ORDER BY mentions DESC
    LIMIT 3;
    '''
    try:
        conn = psycopg.connect(os.getenv('SUPABASE_URL'), options="-c prepare_threshold=0")
        cur = conn.cursor()
        cur.execute(query)
        rows = cur.fetchall()

        # Format as JSON-friendly structure with normalized emotions
        entries = []
        for row in rows:
            # Extract raw emotion values (handling None values)
            emotions = {
                "anger": float(row[2]) if row[2] is not None else 0.0,
                "fear": float(row[3]) if row[3] is not None else 0.0,
                "joy": float(row[4]) if row[4] is not None else 0.0,
                "love": float(row[5]) if row[5] is not None else 0.0,
                "sadness": float(row[6]) if row[6] is not None else 0.0,
                "surprise": float(row[7]) if row[7] is not None else 0.0,
            }

            # Calculate the sum for normalization
            emotion_sum = sum(emotions.values())

            # Normalize emotions (handle case where sum is 0)
            if emotion_sum > 0:
                normalized_emotions = {
                    emotion: value / emotion_sum
                    for emotion, value in emotions.items()
                }
            else:
                # If all emotions are 0, distribute equally
                normalized_emotions = {
                    emotion: 1.0 / 6
                    for emotion in emotions.keys()
                }

            entries.append({
                "name": row[0] if row[0] else None,
                "mentions": row[1],
                "emotions": normalized_emotions
            })

        return jsonify({"top_stims": entries})
    except Exception as e:
        print(f"Error connecting or querying Supabase: {e}")
        return jsonify({"error": "Database query failed"}), 500
    finally:
        if 'cur' in locals() and cur:
            cur.close()
        if 'conn' in locals() and conn:
            conn.close()


if __name__ == '__main__':
    app.run(debug=True, port=8080)