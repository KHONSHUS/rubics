// 3D Matrix Math & Rubik's Geometry Utilities

export const IDENTITY_MATRIX = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1]
];

export const multiplyMatrices = (A, B) =>
  A.map(r => B[0].map((_, j) => r[0] * B[0][j] + r[1] * B[1][j] + r[2] * B[2][j]));

export const multiplyMatrixVector = (A, v) =>
  A.map(r => r[0] * v[0] + r[1] * v[1] + r[2] * v[2]);

export const rotationMatrix = (ax, a) => {
  const c = Math.cos(a), s = Math.sin(a);
  return ax === 0
    ? [[1, 0, 0], [0, c, -s], [0, s, c]]
    : ax === 1
    ? [[c, 0, s], [0, 1, 0], [-s, 0, c]]
    : [[c, -s, 0], [s, c, 0], [0, 0, 1]];
};

export const FACES = [
  { face: 'U', normal: [0, -1, 0], transform: 'rotateX(90deg)' },
  { face: 'D', normal: [0, 1, 0], transform: 'rotateX(-90deg)' },
  { face: 'F', normal: [0, 0, 1], transform: '' },
  { face: 'B', normal: [0, 0, -1], transform: 'rotateY(180deg)' },
  { face: 'R', normal: [1, 0, 0], transform: 'rotateY(90deg)' },
  { face: 'L', normal: [-1, 0, 0], transform: 'rotateY(-90deg)' }
];

export const MOVE_AXIS_MAP = {
  U: [1, -1],
  D: [1, 1],
  L: [0, -1],
  R: [0, 1],
  F: [2, 1],
  B: [2, -1]
};
