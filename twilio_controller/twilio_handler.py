from twilio.rest import Client
from openai import OpenAI
from load_dotenv import load_dotenv
from concurrent.futures import ThreadPoolExecutor
from stim_emotion_connector import draw_connections
from insight_generation import find_similar_stims, grab_previous_insights, generate_insights
import psycopg
import requests
import os
from flask import Flask

app = Flask(__name__)

load_dotenv()

SYSTEM_PROMPT = """
You are an intelligent agent tasked with cleaning up grammatical errors in spoken words. You will
be given a transcript from spoken text which you will have to clean up into correct grammar.

YOU MUST NOT CHANGE TOO MUCH OF THE SENTENCE STRUCTURE OR THE SEMANTIC MEANING OF THE SENTENCES.
"""

# Twilio credentials (from console)
account_sid = os.getenv('TWILIO_ACCOUNT_SID')
auth_token = os.getenv('TWILIO_AUTH_TOKEN')
twilio_url = os.getenv('TWILIO_XML_URL')
client = Client(account_sid, auth_token)
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def make_call():
    call = client.calls.create(
        to="5135809384",
        from_="+18148852603",
        url=os.getenv('TWILIO_XML_URL'),
        method='GET',
        record=True
    )

    print(f"Call SID: {call.sid}")

def get_most_recent_recording():
    recordings = client.recordings.list(limit=1)
    path = os.path.join(os.getcwd(), "twilio_controller\\raw_recordings\\")

    for rec in recordings:
        recording_url = f"https://api.twilio.com{rec.uri.replace('.json', '.wav')}"
        response = requests.get(recording_url, auth=(account_sid, auth_token))

        with open(f"{path}{rec.sid}.wav", "wb") as f:
            f.write(response.content)

        # Transcribe using Whisper
        with open(f"{path}{rec.sid}.wav", "rb") as audio_file:
            transcript = openai_client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file
            )

        return {'recording_id': rec.sid, 'transcript': transcript.text}

def response_cleaner(response):
    transcript = response.get('transcript')

    output = openai_client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[
        {"role": "developer", "content": SYSTEM_PROMPT},
        {"role": "user", "content": f"Transcript: {transcript}"}
    ]
    )

    return output.choices[0].message.content

@app.route('/post-call-action', methods=['GET'])
def twilio_call_end_pipeline():
    with ThreadPoolExecutor(max_workers=3) as executor:
        # Step 1: Get the recording from Twilio
        future_recording = executor.submit(get_most_recent_recording)
        recording_transcript = future_recording.result()  # waits until done

        # Step 2: Clean the transcript
        future_cleaned = executor.submit(response_cleaner, recording_transcript)
        cleaned_transcript = future_cleaned.result()  # waits until done

    # SQL stuff now
    print('HERE 1')
    try:
        conn = psycopg.connect(os.getenv('SUPABASE_URL'), options="-c prepare_threshold=0")
        cur = conn.cursor()

        #TODO: MAKE SURE TO CHANGE THE USER ID TO AN INPUT FROM SESSION
        query = '''
            INSERT INTO "User_Call" (raw_text, cleaned_text, user_id, recording_id)
            VALUES (%s, %s, 3, %s)
            RETURNING id
        '''

        cur.execute(query, (recording_transcript.get('transcript'), cleaned_transcript, recording_transcript.get('recording_id')))
        result = cur.fetchone()
        print(f"Current ID from Supabase: {result[0]}")

        conn.commit()

    except Exception as e:
        print(f"Error connecting or querying Supabase: {e}")
        return "Errorr", 400

    finally:
        # Close the cursor and connection
        if 'cur' in locals() and cur:
            cur.close()
        if 'conn' in locals() and conn:
            conn.close()

    print('HERE 2')

    # SQL Stuff for stims now
    try:
        stim_data = draw_connections(cleaned_transcript)
        conn = psycopg.connect(os.getenv('SUPABASE_URL'), options="-c prepare_threshold=0")
        cur = conn.cursor()

        #TODO: MAKE SURE TO CHANGE THE USER ID TO AN INPUT FROM SESSION
        query = '''
            INSERT INTO "Stimuli" (user_call_id, name, anger, fear, joy, love, sadness, surprise)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        '''

        for obj, emotions in stim_data.items():
            cur.execute(query, (
                result[0],                  # user_call_id (hardcoded for now)
                obj,                # name (the object text)
                emotions.get("anger", 0),
                emotions.get("fear", 0),
                emotions.get("joy", 0),
                emotions.get("love", 0),
                emotions.get("sadness", 0),
                emotions.get("surprise", 0),
            ))
            stim_id = cur.fetchone()[0]
        # result = cur.fetchone()
            print(f"Current ID from Supabase: {stim_id}")

        conn.commit()

    except Exception as e:
        print(f"Error connecting or querying Supabase: {e}")
        return "Errorr", 400

    finally:
        # Close the cursor and connection
        if 'cur' in locals() and cur:
            cur.close()
        if 'conn' in locals() and conn:
            conn.close()

    print('HERE 3')

    #SQL Stuff for insights!
    try:
        similar_stim_ids = find_similar_stims(list(stim_data.keys()))
        previous_insights = grab_previous_insights(stim_ids=similar_stim_ids)
        print('PREV_INSIGHTS', previous_insights)
        new_insights = generate_insights(previous_insights, cleaned_transcript)
        conn = psycopg.connect(os.getenv('SUPABASE_URL'), options="-c prepare_threshold=0")
        cur = conn.cursor()

        insight_table = '''
        INSERT INTO "Call_Insights"
        (insight, user_id, call_id) VALUES (%s, %s, %s)
        RETURNING id
        '''

        insight_stim_table = '''
        INSERT INTO "Stim_Insight" (stim_id, insight_id)
        VALUES (%s, %s)
        '''

        cur.execute(insight_table, (new_insights, 3, result[0]))
        insight_id = cur.fetchone()[0]
        conn.commit()

        for stim_id in similar_stim_ids:
            cur.execute(insight_stim_table, (stim_id, insight_id))
            conn.commit()

    except Exception as e:
        print(f"Error connecting or querying Supabase: {e}")
        return "Errorr", 400

    finally:
        # Close the cursor and connection
        if 'cur' in locals() and cur:
            cur.close()
        if 'conn' in locals() and conn:
            conn.close()

    print('HERE 4')

    return {
        "recording_id": recording_transcript.get("recording_id"),
        "raw_transcript": recording_transcript.get("transcript"),
        "cleaned_transcript": cleaned_transcript
    }, 200

if __name__ == "__main__":
    app.run(debug=True, port=5000)