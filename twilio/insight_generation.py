from load_dotenv import load_dotenv
from openai import OpenAI
import psycopg
from datetime import date
import os

load_dotenv()

openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
today = date.today().isoformat()

SYSTEM_PROMPT = f"""
You are an **Insight Generation Bot**.

You will receive:
1. A cleaned transcript of a recorded conversation.
2. A list of previously generated insights with their dates.
3. Today's date: {today}.

Your task is to:
- Summarize how the user feels in general during the conversation.
- Summarize how the user feels about specific objects they mention.
- Compare these emotions to previous insights and highlight changes or progress over time.
- Present your insights clearly, structured, and concise (e.g., in bullet points or sections).

Give your answer in a concise format, in 1 paragraph. Speak in first person, refer to the user as 'You'
"""


def find_similar_stims(recognized_objects):
    query = '''
    SELECT id FROM "Stimuli"
    WHERE similarity(name, %s) > 0.4
    '''

    try:
        conn = psycopg.connect(os.getenv('SUPABASE_URL'), options="-c prepare_threshold=0")
        cur = conn.cursor()

        stim_ids= []

        for object in recognized_objects:
            cur.execute(query, (object,))
            res = cur.fetchone()

            if res:
                stim_ids.append(res[0])


    except Exception as e:
        print(f"Error connecting or querying db: {e}")
        return e

    finally:
        if 'cur' in locals() and cur:
            cur.close()
        if 'conn'in locals() and conn:
            conn.close()

    return stim_ids

def grab_previous_insights(stim_ids):
    query = '''
    SELECT insight, created_at
    FROM "Call_Insights"
    WHERE id IN (SELECT insight_id FROM "Stim_Insight" WHERE stim_id = %s)
    '''

    try:
        conn = psycopg.connect(os.getenv('SUPABASE_URL'), options="-c prepare_threshold=0")
        cur = conn.cursor()

        insights = []

        for stim_id in stim_ids:
            cur.execute(query, (stim_id,))
            rows = cur.fetchall()

            for row in rows:
                insights.append((row[1].strftime("%Y-%m-%d"), row[0]))

    except Exception as e:
        print(f"Error connecting or querying db: {e}")
        return e

    finally:
        if 'cur' in locals() and cur:
            cur.close()
        if 'conn'in locals() and conn:
            conn.close()


    return insights


def generate_insights(insights, cleaned_transcript):

    output = openai_client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[
        {"role": "developer", "content": SYSTEM_PROMPT},
        {"role": "user", "content": f"Transcript: {cleaned_transcript}"},
        {"role": "user", "content": f"Previous insights: {insights}"}
    ]
    )

    return output.choices[0].message.content