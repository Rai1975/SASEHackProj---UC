import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import requests
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

if __name__ == '__main__':
    app.run(debug=True, port=8080)