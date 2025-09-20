from langchain_openai import ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
from dotenv import load_dotenv
import json
import ast

load_dotenv()

def recognize_objects(text):
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

    extraction_prompt = PromptTemplate(
        input_variables=["text"],
        template="""
    You are an information extraction agent.
    From the input text, identify and return a list of key objects, such as:
    - People
    - Events
    - Things (tangible or conceptual)

    Only return the objects in a Python list format. Like ["Thing A", "Thing B", "Thing C"]

    Text: {text}
    Output:
    """
    )

    object_extractor = LLMChain(llm=llm, prompt=extraction_prompt)
    result = object_extractor.run(text=text)
    result = result[1:-1]
    result = result.split(',')

    for i in range(len(result)):
        result[i] = result[i].strip().replace('"', '')


    return result

# if __name__ == "__main__":
#     print(recognize_objects("Hi, I just woke up. I'm talking to my best friend right now, and I'm really sad that she's so far away from me. I wish she were right next to me, but I am also looking forward to today because I'm going out with my other friends in the evening."))
