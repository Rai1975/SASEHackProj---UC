from load_dotenv import load_dotenv
from openai import OpenAI
import psycopg
from datetime import date
import os
import psycopg

load_dotenv()

openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
today = date.today().isoformat()

SYSTEM_PROMPT = f"""
You are an affirmation generation bot. You will generate warm 1-paragraph affirmations for 
the user that helps motivate them go through their day.

You will be given:
1. Transcripts from their audio journal from last 7 days (from latest to oldest)
2. Insights gained from the transcripts 

Speak in a warm tone and make sure it is in third person, referring to the user as 'You'.
Keep it concise an short, 2-3 very short sentences at max.
"""

def get_this_week_insights():
    query = """
    SELECT uc.cleaned_text, ci.insight
    FROM "User_Call" uc
    JOIN "Call_Insights" ci ON uc.id = ci.call_id
    WHERE uc.created_at >= NOW() - INTERVAL '7 days'
    ORDER BY uc.created_at DESC
    """

    calls = {}

    try:
        conn = psycopg.connect(os.getenv('SUPABASE_URL'), options="-c prepare_threshold=0")
        cur = conn.cursor()

        values = []

        cur.execute(query)
        result = cur.fetchall()

        for i in result:
            values.append((i[0], i[1]))

    except Exception as e:
        print(f"Error connecting or querying db: {e}")
        return e

    finally:
        if 'cur' in locals() and cur:
            cur.close()
        if 'conn'in locals() and conn:
            conn.close()


    if not values:
        return []

    for i in range(len(values)):
        calls[i + 1] = {'call_transcript': values[i][0], 'insight': values[i][1]}

    return calls

def text_for_llm():
    calls = get_this_week_insights()

    final_string = ""

    for index, call in enumerate(calls.items()):
        final_string += f"Call {index + 1}: \n"
        final_string += f"Transcript: {call[1].get('call_transcript')} \n"
        final_string += f"Call Insight: {call[1].get('insight')} \n"
        final_string += "\n"

    return final_string

def generate_affirmation():
    output = openai_client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[
        {"role": "developer", "content": SYSTEM_PROMPT},
        {"role": "user" , "content": text_for_llm()}
    ]
    )

    return output.choices[0].message.content
