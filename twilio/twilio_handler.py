from twilio.rest import Client
from load_dotenv import load_dotenv
import requests
import os

load_dotenv()

# Twilio credentials (from console)
account_sid = os.getenv('TWILIO_ACCOUNT_SID')
auth_token = os.getenv('TWILIO_AUTH_TOKEN')
twilio_url = os.getenv('TWILIO_XML_URL')
client = Client(account_sid, auth_token)

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
    path = os.path.join(os.getcwd(), "twilio\\raw_recordings\\")

    for rec in recordings:
        recording_url = f"https://api.twilio.com{rec.uri.replace('.json', '.mp3')}"
        response = requests.get(recording_url, auth=(account_sid, auth_token))

        with open(f"{path}{rec.sid}.mp3", "wb") as f:
            f.write(response.content)

        return rec.sid