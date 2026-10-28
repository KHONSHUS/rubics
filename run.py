"""
Rubik's Cube Fullstack Launcher
Starts the unified server hosting both the React Web UI and Python FastAPI backend.
"""
import subprocess
import sys
import os

def main():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.join(root_dir, "backend")

    print("=" * 60)
    print("Rubik's Cube 3D — Fullstack React & Python")
    print("=" * 60)
    print("Serving on http://localhost:8000")
    print("API Documentation on http://localhost:8000/docs")
    print("Press Ctrl+C to stop the server.\n")

    cmd = [
        sys.executable,
        "-m",
        "uvicorn",
        "main:app",
        "--host",
        "127.0.0.1",
        "--port",
        "8000"
    ]
    try:
        subprocess.run(cmd, cwd=backend_dir)
    except KeyboardInterrupt:
        print("\nServer stopped.")

if __name__ == "__main__":
    main()
