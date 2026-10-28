"""
cube_logic.py - Rubik's Cube State Machine and Solver Utilities
Supports 2x2 and 3x3 cubes, scramble generation, move application, and solved-state validation.
"""

import copy
import random
from typing import List, Dict, Tuple, Optional

# Standard Rubik's Cube faces and colors
FACES = ['U', 'D', 'F', 'B', 'R', 'L']
FACE_NAMES = {
    'U': 'Up (White)',
    'D': 'Down (Yellow)',
    'F': 'Front (Green)',
    'B': 'Back (Blue)',
    'R': 'Right (Red)',
    'L': 'Left (Orange)'
}

AXIS_OPPOSITES = {
    'U': 'D', 'D': 'U',
    'L': 'R', 'R': 'L',
    'F': 'B', 'B': 'F'
}


def invert_move(move: str) -> str:
    """Inverts a standard Rubik's move (e.g. U -> U', U' -> U, U2 -> U2)."""
    if move.endswith("'"):
        return move[:-1]
    elif move.endswith("2"):
        return move
    else:
        return move + "'"


class RubiksCube:
    def __init__(self, size: int = 3):
        if size not in (2, 3):
            raise ValueError("Size must be 2 or 3")
        self.size = size
        self.history: List[str] = []
        self.faces: Dict[str, List[List[str]]] = {}
        self.reset()

    def reset(self):
        """Initializes cube to fully solved state."""
        self.history = []
        self.faces = {
            face: [[face for _ in range(self.size)] for _ in range(self.size)]
            for face in FACES
        }

    def is_solved(self) -> bool:
        """Checks if all faces have uniform color."""
        for face, grid in self.faces.items():
            first_color = grid[0][0]
            for row in grid:
                for sticker in row:
                    if sticker != first_color:
                        return False
        return True

    def _rotate_matrix_cw(self, m: List[List[str]]) -> List[List[str]]:
        """Rotates an N x N matrix 90 degrees clockwise."""
        n = self.size
        return [[m[n - 1 - j][i] for j in range(n)] for i in range(n)]

    def _rotate_matrix_ccw(self, m: List[List[str]]) -> List[List[str]]:
        """Rotates an N x N matrix 90 degrees counter-clockwise."""
        n = self.size
        return [[m[j][n - 1 - i] for j in range(n)] for i in range(n)]

    def apply_move(self, move: str):
        """
        Applies a move in Singmaster notation:
        e.g., 'U', \"U'\", 'U2', 'R', \"R'\", etc.
        """
        move = move.strip()
        if not move:
            return

        base = move[0].upper()
        if base not in FACES:
            raise ValueError(f"Invalid face in move: {move}")

        is_double = move.endswith("2")
        is_prime = move.endswith("'")

        if is_double:
            self._apply_quarter_turn(base, prime=False)
            self._apply_quarter_turn(base, prime=False)
        elif is_prime:
            self._apply_quarter_turn(base, prime=True)
        else:
            self._apply_quarter_turn(base, prime=False)

        self.history.append(move)

    def _apply_quarter_turn(self, face: str, prime: bool = False):
        n = self.size
        # 1. Rotate the face itself
        if prime:
            self.faces[face] = self._rotate_matrix_ccw(self.faces[face])
        else:
            self.faces[face] = self._rotate_matrix_cw(self.faces[face])

        # 2. Cycle adjacent edges
        # Depending on the face, 4 edges circulate.
        f = self.faces
        if face == 'U':
            # Edges: F top -> L top -> B top -> R top (clockwise from top view)
            if not prime:
                tmp = [f['F'][0][i] for i in range(n)]
                for i in range(n): f['F'][0][i] = f['R'][0][i]
                for i in range(n): f['R'][0][i] = f['B'][0][i]
                for i in range(n): f['B'][0][i] = f['L'][0][i]
                for i in range(n): f['L'][0][i] = tmp[i]
            else:
                tmp = [f['F'][0][i] for i in range(n)]
                for i in range(n): f['F'][0][i] = f['L'][0][i]
                for i in range(n): f['L'][0][i] = f['B'][0][i]
                for i in range(n): f['B'][0][i] = f['R'][0][i]
                for i in range(n): f['R'][0][i] = tmp[i]

        elif face == 'D':
            # Edges: F bottom -> R bottom -> B bottom -> L bottom
            if not prime:
                tmp = [f['F'][n - 1][i] for i in range(n)]
                for i in range(n): f['F'][n - 1][i] = f['L'][n - 1][i]
                for i in range(n): f['L'][n - 1][i] = f['B'][n - 1][i]
                for i in range(n): f['B'][n - 1][i] = f['R'][n - 1][i]
                for i in range(n): f['R'][n - 1][i] = tmp[i]
            else:
                tmp = [f['F'][n - 1][i] for i in range(n)]
                for i in range(n): f['F'][n - 1][i] = f['R'][n - 1][i]
                for i in range(n): f['R'][n - 1][i] = f['B'][n - 1][i]
                for i in range(n): f['B'][n - 1][i] = f['L'][n - 1][i]
                for i in range(n): f['L'][n - 1][i] = tmp[i]

        elif face == 'R':
            # Edges: U right col, B left col (reversed), D right col, F right col
            if not prime:
                tmp = [f['U'][i][n - 1] for i in range(n)]
                for i in range(n): f['U'][i][n - 1] = f['F'][i][n - 1]
                for i in range(n): f['F'][i][n - 1] = f['D'][i][n - 1]
                for i in range(n): f['D'][i][n - 1] = f['B'][n - 1 - i][0]
                for i in range(n): f['B'][n - 1 - i][0] = tmp[i]
            else:
                tmp = [f['U'][i][n - 1] for i in range(n)]
                for i in range(n): f['U'][i][n - 1] = f['B'][n - 1 - i][0]
                for i in range(n): f['B'][n - 1 - i][0] = f['D'][i][n - 1]
                for i in range(n): f['D'][i][n - 1] = f['F'][i][n - 1]
                for i in range(n): f['F'][i][n - 1] = tmp[i]

        elif face == 'L':
            # Edges: U left col, F left col, D left col, B right col (reversed)
            if not prime:
                tmp = [f['U'][i][0] for i in range(n)]
                for i in range(n): f['U'][i][0] = f['B'][n - 1 - i][n - 1]
                for i in range(n): f['B'][n - 1 - i][n - 1] = f['D'][i][0]
                for i in range(n): f['D'][i][0] = f['F'][i][0]
                for i in range(n): f['F'][i][0] = tmp[i]
            else:
                tmp = [f['U'][i][0] for i in range(n)]
                for i in range(n): f['U'][i][0] = f['F'][i][0]
                for i in range(n): f['F'][i][0] = f['D'][i][0]
                for i in range(n): f['D'][i][0] = f['B'][n - 1 - i][n - 1]
                for i in range(n): f['B'][n - 1 - i][n - 1] = tmp[i]

        elif face == 'F':
            # Edges: U bottom row, R left col, D top row (reversed), L right col (reversed)
            if not prime:
                tmp = [f['U'][n - 1][i] for i in range(n)]
                for i in range(n): f['U'][n - 1][i] = f['L'][n - 1 - i][n - 1]
                for i in range(n): f['L'][n - 1 - i][n - 1] = f['D'][0][n - 1 - i]
                for i in range(n): f['D'][0][n - 1 - i] = f['R'][i][0]
                for i in range(n): f['R'][i][0] = tmp[i]
            else:
                tmp = [f['U'][n - 1][i] for i in range(n)]
                for i in range(n): f['U'][n - 1][i] = f['R'][i][0]
                for i in range(n): f['R'][i][0] = f['D'][0][n - 1 - i]
                for i in range(n): f['D'][0][n - 1 - i] = f['L'][n - 1 - i][n - 1]
                for i in range(n): f['L'][n - 1 - i][n - 1] = tmp[i]

        elif face == 'B':
            # Edges: U top row, L left col, D bottom row, R right col
            if not prime:
                tmp = [f['U'][0][i] for i in range(n)]
                for i in range(n): f['U'][0][i] = f['R'][i][n - 1]
                for i in range(n): f['R'][i][n - 1] = f['D'][n - 1][n - 1 - i]
                for i in range(n): f['D'][n - 1][n - 1 - i] = f['L'][n - 1 - i][0]
                for i in range(n): f['L'][n - 1 - i][0] = tmp[i]
            else:
                tmp = [f['U'][0][i] for i in range(n)]
                for i in range(n): f['U'][0][i] = f['L'][n - 1 - i][0]
                for i in range(n): f['L'][n - 1 - i][0] = f['D'][n - 1][n - 1 - i]
                for i in range(n): f['D'][n - 1][n - 1 - i] = f['R'][i][n - 1]
                for i in range(n): f['R'][i][n - 1] = tmp[i]

    def generate_scramble(self, length: Optional[int] = None) -> List[str]:
        """
        Generates standard WCA-style scramble avoiding consecutive moves on the same face.
        """
        if length is None:
            length = 11 if self.size == 2 else 20

        scramble = []
        last_face = ""
        modifiers = ["", "'", "2"]

        for _ in range(length):
            available = [f for f in FACES if f != last_face]
            face = random.choice(available)
            mod = random.choice(modifiers)
            scramble.append(f"{face}{mod}")
            last_face = face

        return scramble

    def get_reverse_solution(self) -> List[str]:
        """Returns the exact inverse sequence to reverse current move history."""
        return [invert_move(m) for m in reversed(self.history)]

    def to_dict(self) -> dict:
        return {
            "size": self.size,
            "faces": self.faces,
            "history": self.history,
            "move_count": len(self.history),
            "is_solved": self.is_solved()
        }
