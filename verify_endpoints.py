
import requests
import json
import time

def verify_app():
    base_url = "http://127.0.0.1:5000"
    print(f"Verifying app at {base_url}...")

    # Wait for server to potentially restart
    time.sleep(2)

    # 1. Verify Homepage
    try:
        response = requests.get(base_url)
        if response.status_code == 200:
            print("[OK] Homepage loaded successfully (Status 200)")
            if "LearnSphere" in response.text:
                 print("[OK] Homepage contains expected title 'LearnSphere'")
            else:
                 print("[WARN] Homepage missing 'LearnSphere' text")
        else:
            print(f"[FAIL] Homepage failed with status {response.status_code}")
    except Exception as e:
        print(f"[FAIL] Failed to reach homepage: {e}")
        return

    # 2. Verify API Generation (Mock)
    try:
        payload = {"topic": "Linear Regression", "level": "Beginner"}
        headers = {"Content-Type": "application/json"}
        response = requests.post(f"{base_url}/api/generate", json=payload, headers=headers)
        
        if response.status_code == 200:
            print("[OK] API /api/generate responded successfully (Status 200)")
            try:
                data = response.json()
                if "mock backend" in data.get("code", "") or "Mock Generated" in data.get("explanation", ""):
                     print("[WARN] API returned mock data (API Key missing or invalid)")
                     print(f"Explanation snippet: {data.get('explanation', '')[:100]}...")
                elif "explanation" in data:
                     print("[OK] API returned real data (API Key present)")
                     print(f"Explanation snippet: {data.get('explanation', '')[:100]}...")
                else:
                     print(f"[WARN] API returned unexpected structure: {list(data.keys())}")
            except Exception as e:
                print(f"[FAIL] Failed to parse JSON: {e}")
        else:
            print(f"[FAIL] API failed with status {response.status_code}: {response.text}")
    except Exception as e:
        print(f"[FAIL] Failed to reach API: {e}")

    # 3. Verify Login Page
    try:
        response = requests.get(f"{base_url}/login")
        if response.status_code == 200:
            print("[OK] Login page loaded successfully (Status 200)")
        else:
            print(f"[FAIL] Login page failed with status {response.status_code}")
    except Exception as e:
        print(f"[FAIL] Failed to reach login page: {e}")

    # 4. Verify Editor Page
    try:
        response = requests.get(f"{base_url}/editor")
        if response.status_code == 200:
            print("[OK] Editor page loaded successfully (Status 200)")
        else:
            print(f"[FAIL] Editor page failed with status {response.status_code}")
    except Exception as e:
        print(f"[FAIL] Failed to reach editor page: {e}")

    # 5. Verify Code Execution API
    try:
        code_payload = {"code": "print('Test Output')"}
        headers = {"Content-Type": "application/json"}
        response = requests.post(f"{base_url}/api/run", json=code_payload, headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            if "Test Output" in data.get("output", ""):
                print("[OK] Code execution successful. Output matches.")
            else:
                print(f"[FAIL] Code execution ran but output mismatch: {data}")
        else:
            print(f"[FAIL] Code execution API failed with status {response.status_code}")
    except Exception as e:
        print(f"[FAIL] Failed to reach Code Execution API: {e}")

if __name__ == "__main__":
    verify_app()
