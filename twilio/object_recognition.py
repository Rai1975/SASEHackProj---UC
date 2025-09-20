from langchain_openai import ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
from dotenv import load_dotenv
import json
import ast

load_dotenv()

def recognize_objects(text):
    """Extract specific, concrete objects from text with detailed examples."""
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

    prompt = PromptTemplate(
        input_variables=["text"],
        template="""
You are a precise information extraction agent. Extract ONLY specific, concrete objects from the text.

INCLUDE:
- Named people: "John", "Sarah", "my brother"
- Specific events: "hackathon", "wedding", "meeting", "conference"
- Concrete objects: "computer", "car", "book", "phone", "code"
- Specific places: "office", "home", "park", "restaurant name"
- Organizations: "Google", "university", "startup"
- Projects/Products: "mobile app", "website", "research paper"

DO NOT INCLUDE:
- Abstract feelings: "anxiety", "happiness", "stress"
- Vague terms: "things", "stuff", "everything", "something"
- Actions/verbs: "working", "pushing", "running"
- Adjectives/qualities: "good", "great", "difficult"
- Time references: "now", "today", "later"
- Pronouns: "I", "you", "it", "this", "that"

Examples:
Input: "I'm working on my iPhone app with Sarah at the Google office"
Output: ["iPhone app", "Sarah", "Google office"]

Input: "The presentation went well, everyone loved the new design"
Output: ["presentation", "design"]

Text: {text}

Return only a valid list of strings like ['Thing A', 'Thing B']:
"""
    )

    object_extractor = LLMChain(llm=llm, prompt=prompt)
    result = object_extractor.run(text=text)

    return result

def consolidate_and_validate_objects(objects_str: str, original_text: str):
    """Clean and validate extracted objects with access to original context."""
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

    consolidation_prompt = PromptTemplate(
        input_variables=["objects", "original_text"],
        template="""
You are validating extracted objects against the original text.

Original text: {original_text}
Extracted objects: {objects}

For each object, verify it meets these criteria:
1. Actually appears in or is clearly referenced in the original text
2. Is a concrete noun (person, place, thing, event, organization)
3. Is specific enough to be meaningful (not "things", "stuff", "something")
4. Represents an entity someone could point to or name specifically

Clean the list by:
- Removing vague/generic terms
- Removing abstract concepts unless they're specific (e.g., "machine learning" is OK, "learning" is not)
- Keeping compound terms that represent specific things
- Standardizing similar references to the same object

Return ONLY a cleaned list of strings like ['Thing A', 'Thing B']:
"""
    )

    cleaner = LLMChain(llm=llm, prompt=consolidation_prompt)
    cleaned = cleaner.run(objects=objects_str, original_text=original_text)
    return cleaned

def parse_object_list(objects_str: str):
    """Safely parse the string representation of a Python list."""
    try:
        # Try to parse as JSON first (more reliable)
        if objects_str.strip().startswith('['):
            return json.loads(objects_str.replace("'", '"'))
    except:
        pass

    try:
        # Fallback to ast.literal_eval for Python list format
        return ast.literal_eval(objects_str.strip())
    except:
        pass

    # Last resort: manual parsing
    objects_str = objects_str.strip()
    if objects_str.startswith('[') and objects_str.endswith(']'):
        content = objects_str[1:-1]
        if content:
            items = [item.strip().strip('"\'') for item in content.split(',')]
            return [item for item in items if item]

    return []

def extract_objects_pipeline(text: str):
    """Complete pipeline for object extraction with error handling."""
    print(f"Processing text: {text}")
    print("-" * 50)

    # Step 1: Initial extraction
    raw_objects = recognize_objects(text)
    print(f"Raw extraction: {raw_objects}")

    # Step 2: Consolidation with original context
    cleaned_objects_str = consolidate_and_validate_objects(raw_objects, text)
    print(f"Cleaned extraction: {cleaned_objects_str}")

    # Step 3: Parse to actual list
    final_objects = parse_object_list(cleaned_objects_str)
    print(f"Final parsed objects: {final_objects}")

    return final_objects
