import requests
import json

url = "http://127.0.0.1:5000/api/generate"
payload = {"topic": "Linear Regression", "level": "Beginner"}
headers = {"Content-Type": "application/json"}

# Test multiple topics to ensure robustness
topics = ["Linear Regression", "Neural Networks", "Decision Trees"]

for topic in topics:
    print(f"\n--- Testing Topic: {topic} ---")
    payload = {"topic": topic, "level": "Beginner"}
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        data = response.json()
        
        # print("Status Code:", response.status_code)
        if "xray" in data:
            print("X-Ray Data Found (Keys):", list(data["xray"].keys()))
        else:
            print("X-Ray Data NOT Found!")
            if isinstance(data, dict):
                print("Keys found:", data.keys())

        if "diagram" in data:
            print("Diagram Code Start:", data["diagram"][:50].replace('\n', '\\n'))
        else:
            print("Diagram NOT Found!")
            
    except Exception as e:
        print(f"Error testing {topic}: {e}")
