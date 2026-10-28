# 3D Rubik's Cube — Fullstack React & Python

An interactive 3D Rubik's Cube application featuring a **React (Vite)** 3D client and a **Python (FastAPI)** backend state engine with scramble generation, solution hints, and speedcubing session analytics.

---

## 1. Code Review of the Original Implementation

The original codebase consisted of three files (`index.html`, `style.css`, and `script.js`):

### Strengths & Architectural Highlights
- **CSS 3D Engine Without Heavy Dependencies**: It avoided heavyweight 3D renderers (such as Three.js), instead leveraging hardware-accelerated CSS 3D transforms (`preserve-3d`, `matrix3d`, `rotateX`, `rotateY`).
- **Matrix Mathematics**: It cleanly implemented 3x3 rotation matrices (`rot`), matrix-matrix multiplication (`mul`), and matrix-vector dot products (`mv`) for discrete 90° rotations on 3D coordinates.
- **Animation Easing**: The face rotation queue (`pump()`) utilized cubic easing for fluid quarter turns, avoiding abrupt jumps between states.
- **Vector Normal State Validation**: Solved state detection (`solved()`) checked normal vector projections across cubie facelets rather than hardcoding static face permutations.

### Bottlenecks & Weaknesses Identified
- **Tight Coupling & Monolithic Global State**: Game state (`cubies`, `queue`, `anim`, `count`, `scr`, `N`, `view`) was stored entirely in mutable global variables without encapsulation or separation of concerns.
- **Direct DOM Manipulation in Math Loop**: Rendering directly mutated DOM styles (`$('#cube').style.transform`, `e.style.transform = 'matrix3d(...)'`) interspersed with game logic, making testing and modular reuse impossible.
- **Absence of Backend State & Persistence**: No server-side move validation, session tracking, official WCA-style scrambles, or step-by-step solver advice.
- **Fragile State Reconciliation**: Dynamic DOM recreation on resize and reset destroyed and rebuilt elements, resetting transitions and memory references.

---

## 2. Refactored Fullstack Architecture

```
game-rubics/
├── backend/                  # Python FastAPI Backend
│   ├── cube_logic.py         # Rubik's cube state machine, WCA scrambles & solver
│   ├── main.py               # REST API endpoints & CORS middleware
│   ├── test_cube.py          # Unit tests (state cycle, inverse moves, solve detection)
│   └── requirements.txt      # Dependencies: fastapi, uvicorn, pydantic
├── frontend/                 # Modern React Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── CubeStage.jsx # 60 FPS CSS 3D Cube with pointer drag & animations
│   │   │   ├── Header.jsx    # Mode, theme, dimensions & action buttons
│   │   │   ├── Controls.jsx  # Face buttons, move count, live timer & hints
│   │   │   └── StatsModal.jsx# Speedcubing analytics (best time, averages, history)
│   │   ├── utils/
│   │   │   ├── matrix.js     # Pure 3D matrix math & coordinate geometry
│   │   │   └── api.js        # Python backend API client with offline fallback
│   │   ├── App.jsx           # Root application state & keyboard event dispatch
│   │   └── App.css           # Clean responsive styling & dark/light theme tokens
│   └── package.json
├── run.py                    # One-command dual launcher for backend + frontend
└── README.md
```

### Key Enhancements
1. **React Component Hierarchy**: Clean decoupling of header, 3D stage, controls, and speedcubing metrics modal.
2. **Dual-Mode Operation**: The React client runs seamlessly connected to the Python backend; if the backend is offline, it gracefully falls back to local simulation mode.
3. **Python State Engine & API**:
   - `GET /api/state`: Current cube state and solved status.
   - `POST /api/scramble`: Generates WCA-standard scramble sequences.
   - `POST /api/move`: Applies and validates moves in Singmaster notation (`U`, `U'`, `R2`, etc.).
   - `GET /api/solve`: Provides reverse-move solution sequence / step hints.
   - `POST /api/session/record` & `GET /api/session/stats`: Tracks solve durations, move counts, and personal bests.
4. **Speedcubing Stopwatch**: Live timer activates automatically upon the first turn after scrambling and stops upon solve, saving your time to the records table.

---

## 3. How to Run

### Running with `npm run dev` (Hot-Reload Dev Server)
From the project root:
```bash
npm run dev
```
Open in browser:
- **Dev Web App**: [http://localhost:5173](http://localhost:5173) (features live hot-module replacement as you edit code)

---

### Quick Start (Unified Fullstack Server)
Run the root launcher or start the server directly:
```bash
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --app-dir backend
```
Open in browser:
- **Web App**: [http://localhost:8000](http://localhost:8000)
- **Backend API & Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

### Running Separately

#### 1. Python Backend
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```
Run backend unit tests:
```bash
cd backend
python test_cube.py
```

#### 2. React Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## 4. Controls & Shortcuts
- **Rotate Face Clockwise**: <kbd>U</kbd> <kbd>D</kbd> <kbd>L</kbd> <kbd>R</kbd> <kbd>F</kbd> <kbd>B</kbd>
- **Rotate Face Counter-Clockwise**: Hold <kbd>Shift</kbd> + face key (<kbd>Shift</kbd> + <kbd>U</kbd>, etc.)
- **Orbit Camera / View**: Drag with mouse/touch or use <kbd>Arrow Keys</kbd>
- **Scramble**: <kbd>Space</kbd> or click "Scramble"
- **Reset**: <kbd>Escape</kbd> or click "Reset"
