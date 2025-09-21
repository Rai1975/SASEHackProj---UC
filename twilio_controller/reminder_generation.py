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
You are a reminder generation bot. You will make reminders in bullet point format with the time and action item.
Think of it as "Things to Look Forward To", as what you will be generating.

You will be given:
1. Today's date for reference
2. Transcripts from an audio journal from the previous week
3. The dates on the days the transcript was recorded for your reference

You must:
1. Look our for dates, or relative dates/times mentioned
2. Generate bullet point format action items based on what they say

Example:
User: "Today is great. I am looking forward to meeting James tomorrow."
Output: "
    - Meeting James
"

DO NOT MENTION DATES IN THE OUTPUT. HIGHLIGHT ACTIVITES TO LOOK FORWARD TO. DO NOT USE MARKDOWN.
Today is: {today}
"""

def get_this_week_calls():
    query = """
    SELECT uc.cleaned_text, uc.created_at
    FROM "User_Call" uc
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
            values.append((i[1], i[0]))

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
        calls[i + 1] = {'recorded_date': values[i][0], 'transcript': values[i][1]}

    return calls

def text_for_llm():
    calls = get_this_week_calls()

    final_string = ""

    for index, call in enumerate(calls.items()):
        final_string += f"Call {index + 1}: \n"
        final_string += f"Date Recorded: {call[1].get('recorded_date')} \n"
        final_string += f"Call Transcript: {call[1].get('transcript')} \n"
        final_string += "\n"

    return final_string


def generate_reminders():
    output = openai_client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[
        {"role": "developer", "content": SYSTEM_PROMPT},
        {"role": "user" , "content": text_for_llm()}
    ]
    )

    return output.choices[0].message.content