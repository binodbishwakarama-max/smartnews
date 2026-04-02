import requests

def test_login():
    url = "http://127.0.0.1:8000/api/v1/auth/login/access-token"
    # Create a dummy user first to ensure it exists
    signup_url = "http://127.0.0.1:8000/api/v1/auth/signup"
    try:
        data = {"username": "testuser", "password": "testpassword"}
        r = requests.post(signup_url, params=data)
        print(f"Signup Status: {r.status_code}")
        print(f"Signup Response: {r.text}")
    except Exception as e:
        print(f"Signup Failed: {e}")

    # Now try to login
    try:
        data = {"username": "testuser", "password": "testpassword"}
        print(f"Attempting login to {url} with {data}")
        r = requests.post(url, data=data)
        print(f"Login Status: {r.status_code}")
        print(f"Login Response: {r.text}")
    except Exception as e:
        print(f"Login Request Failed: {e}")

if __name__ == "__main__":
    test_login()
