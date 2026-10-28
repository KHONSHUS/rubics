import os
import time
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from cube_logic import RubiksCube, invert_move

app = FastAPI(title="Rubik's Cube API", version="1.0.0")

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory game state and stats storage
active_cube = RubiksCube(size=3)
solve_history = []
active_session_start: Optional[float] = None

class MoveRequest(BaseModel):
    move: Optional[str] = None
    moves: Optional[List[str]] = None

class ResetRequest(BaseModel):
    size: Optional[int] = 3

class ScrambleRequest(BaseModel):
    length: Optional[int] = None
    apply_to_state: Optional[bool] = True

class RecordSolveRequest(BaseModel):
    time_seconds: float = Field(..., gt=0)
    move_count: int = Field(..., ge=1)
    scramble: Optional[str] = ""

@app.get("/api/health")
def health():
    return {"status": "ok", "timestamp": time.time()}

@app.get("/api/state")
def get_state():
    return {
        **active_cube.to_dict(),
        "active_timer_running": active_session_start is not None
    }

@app.post("/api/reset")
def reset_cube(req: ResetRequest):
    global active_cube, active_session_start
    if req.size not in (2, 3):
        raise HTTPException(status_code=400, detail="Only sizes 2 and 3 supported")
    active_cube = RubiksCube(size=req.size)
    active_session_start = None
    return active_cube.to_dict()

@app.post("/api/move")
def apply_move(req: MoveRequest):
    global active_session_start
    if req.move:
        try:
            active_cube.apply_move(req.move)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
    elif req.moves:
        for m in req.moves:
            try:
                active_cube.apply_move(m)
            except ValueError as e:
                raise HTTPException(status_code=400, detail=str(e))
    else:
        raise HTTPException(status_code=400, detail="Either 'move' or 'moves' required")

    # If first move after scramble, start timer if not running
    if active_session_start is None and not active_cube.is_solved():
        active_session_start = time.time()

    return active_cube.to_dict()

@app.post("/api/scramble")
def scramble_cube(req: ScrambleRequest):
    global active_session_start
    moves = active_cube.generate_scramble(length=req.length)
    if req.apply_to_state:
        for m in moves:
            active_cube.apply_move(m)
        active_session_start = None
    return {
        "scramble_sequence": moves,
        "scramble_str": " ".join(moves),
        "cube": active_cube.to_dict()
    }

@app.get("/api/solve")
def get_solution():
    if active_cube.is_solved():
        return {"solution": [], "message": "Cube is already solved!"}
    
    # Reverse of recent moves provides an immediate valid solution
    reverse_moves = active_cube.get_reverse_solution()
    return {
        "solution": reverse_moves,
        "solution_str": " ".join(reverse_moves),
        "steps_count": len(reverse_moves)
    }

@app.post("/api/session/record")
def record_solve(req: RecordSolveRequest):
    record = {
        "id": len(solve_history) + 1,
        "time_seconds": round(req.time_seconds, 2),
        "move_count": req.move_count,
        "scramble": req.scramble,
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
    }
    solve_history.append(record)
    return {"message": "Solve recorded", "record": record}

@app.get("/api/session/stats")
def get_stats():
    if not solve_history:
        return {
            "total_solves": 0,
            "best_time": None,
            "average_time": None,
            "history": []
        }
    times = [s["time_seconds"] for s in solve_history]
    return {
        "total_solves": len(solve_history),
        "best_time": min(times),
        "average_time": round(sum(times) / len(times), 2),
        "history": solve_history[-10:] # last 10 solves
    }

# Serve React Web Frontend
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
if os.path.exists(frontend_dist):
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    def serve_frontend(full_path: str):
        if full_path.startswith("api"):
            raise HTTPException(status_code=404, detail="API endpoint not found")
        file_path = os.path.join(frontend_dist, full_path)
        if full_path and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))
