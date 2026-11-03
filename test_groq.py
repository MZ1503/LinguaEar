import os
import json
from groq import Groq
from dotenv import load_dotenv

# .env file se keys load karna
load_dotenv()


api_key = os.getenv("EXPO_PUBLIC_GROQ_API_KEY")
if not api_key:
    print("❌ Error: GROQ_API_KEY not found in .env file.")
    exit(1)

client = Groq(api_key=api_key)

print("🚀 Testing LinguaEar 'Amt Simulation' Game Mode with Llama 3...")

# Real Immigrant Mock Data (Ausländerbehörde Scenario)
scenario = "Visa Extension at Ausländerbehörde"
officer_statement = "Guten Tag. Zeigen Sie mir bitte Ihren Pass und den aktuellen Mietvertrag."
user_speech_text = "Hallo. Hier ist mein Pass, und das ist mein... uhm... paper for house." 

# Strict System Prompt to guide the AI Bureaucrat
system_prompt = (
    "You are the backend engine for LinguaEar, a gamified German learning app for immigrants. "
    "Analyze the user's imperfect German response to the government officer. "
    "Provide constructive feedback to reduce anxiety. "
    "You MUST respond strictly in a valid JSON format with the following exact keys:\n"
    "1. 'score': an integer from 0 to 100\n"
    "2. 'corrections': clear feedback in English explaining how to say 'Mietvertrag' or fix grammar\n"
    "3. 'better_german_phrase': How a native speaker would professionally reply\n"
    "4. 'next_officer_line': The next logical challenge the officer will say in German to continue the game"
)

user_prompt = f"Scenario: {scenario}\nOfficer Said: {officer_statement}\nUser Replied: {user_speech_text}"

try:
    # Ultra-fast evaluation call
    completion = client.chat.completions.create(
        model="openai/gpt-oss-20b",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        response_format={"type": "json_object"}, # Forces Llama3 to output pure JSON
        temperature=0.3
    )
    
    # Parsing and formatting output
    response_json = json.loads(completion.choices[0].message.content)
    
    print("\n✅ --- GROQ RESPONSE RECEIVED (Instant & Free) ---")
    print(json.dumps(response_json, indent=4))
    print("--------------------------------------------------\n")

except Exception as e:
    print(f"❌ Testing Failed: {str(e)}")