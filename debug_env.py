import sys
import os

print(f"Python Executable: {sys.executable}")
print(f"Python Version: {sys.version}")
print(f"Current Directory: {os.getcwd()}")
print("sys.path:")
for p in sys.path:
    print(f"  {p}")

try:
    import flask
    print(f"Flask found at: {flask.__file__}")
except ImportError as e:
    print(f"Flask not found: {e}")

try:
    import flask_sqlalchemy
    print(f"Flask-SQLAlchemy found at: {flask_sqlalchemy.__file__}")
except ImportError as e:
    print(f"Flask-SQLAlchemy not found: {e}")

try:
    import flask_login
    print(f"Flask-Login found at: {flask_login.__file__}")
except ImportError as e:
    print(f"Flask-Login not found: {e}")
