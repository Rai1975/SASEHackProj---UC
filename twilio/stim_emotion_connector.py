import pickle
import re
from object_recognition import extract_objects_pipeline
import os

model = pickle.load(open(os.path.join(os.getcwd(), 'twilio\\rf_model.pkl'), 'rb'))

def draw_connections(text):
    object_emotions = {}
    objects = extract_objects_pipeline(text)   # assumes this returns a list of objects
    sentences = re.split(r'(?<=[.!?]) +', text)

    for sentence in sentences:
        scores = model.predict_proba([sentence])[0]  # probability scores for this sentence
        for obj in objects:
            if obj in sentence:
                # Map object → {emotion: score}
                object_emotions[obj] = {
                    emotion: float(score)
                    for emotion, score in zip(model.classes_, scores)
                }

    return object_emotions


# if __name__=="__main__":
#     print(draw_connections("I like apples and Bananas."))
