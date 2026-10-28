import unittest
from cube_logic import RubiksCube, invert_move

class TestRubiksCube(unittest.TestCase):
    def test_solved_at_init(self):
        c = RubiksCube(size=3)
        self.assertTrue(c.is_solved())
        c2 = RubiksCube(size=2)
        self.assertTrue(c2.is_solved())

    def test_single_turn_and_inverse(self):
        c = RubiksCube(size=3)
        for move in ['U', 'D', 'L', 'R', 'F', 'B']:
            c.apply_move(move)
            self.assertFalse(c.is_solved(), f"Should not be solved after {move}")
            c.apply_move(invert_move(move))
            self.assertTrue(c.is_solved(), f"Should be solved after {move} + {invert_move(move)}")

    def test_double_turn(self):
        c = RubiksCube(size=3)
        c.apply_move('R2')
        self.assertFalse(c.is_solved())
        c.apply_move('R2')
        self.assertTrue(c.is_solved())

    def test_four_turns_identity(self):
        c = RubiksCube(size=3)
        for _ in range(4):
            c.apply_move('F')
        self.assertTrue(c.is_solved())

    def test_sexy_move_six_times(self):
        # (R U R' U') x 6 returns cube to original solved state
        c = RubiksCube(size=3)
        for _ in range(6):
            c.apply_move('R')
            c.apply_move('U')
            c.apply_move("R'")
            c.apply_move("U'")
        self.assertTrue(c.is_solved())

    def test_reverse_solution(self):
        c = RubiksCube(size=3)
        scramble = c.generate_scramble(10)
        for m in scramble:
            c.apply_move(m)
        solution = c.get_reverse_solution()
        for m in solution:
            c.apply_move(m)
        self.assertTrue(c.is_solved())

if __name__ == '__main__':
    unittest.main()
