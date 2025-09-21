import pickle
import re
from object_recognition import recognize_objects
import os

model = pickle.load(open(os.path.join(os.getcwd(), 'twilio_controller\\rf_model.pkl'), 'rb'))

def draw_connections(text):
    object_emotions = {}
    objects = recognize_objects(text)   # assumes this returns a list of objects
    sentences = re.split(r'(?<=[.!?]) +', text)

    for sentence in sentences:
        scores = model.predict_proba([sentence])[0]  # probability scores for this sentence
        for obj in objects:
            print(obj)
            if obj in sentence:
                # Map object → {emotion: score}
                object_emotions[obj] = {
                    emotion: float(score)
                    for emotion, score in zip(model.classes_, scores)
                }

    return object_emotions


# if __name__=="__main__":
#     print(draw_connections("Hi, I just woke up. I'm talking to my best friend right now, and I'm really sad that she's so far away from me. I wish she were right next to me, but I am also looking forward to today because I'm going out with my other friends in the evening."))