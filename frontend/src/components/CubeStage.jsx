import React, { useEffect, useRef, useCallback } from 'react';
import {
  IDENTITY_MATRIX,
  multiplyMatrices,
  multiplyMatrixVector,
  rotationMatrix,
  FACES,
  MOVE_AXIS_MAP,
} from '../utils/matrix';

export default function CubeStage({
  size,
  onMoveCompleted,
  onSolved,
  onScrambleFinish,
  viewAngle,       // read as initial value only; updates go through viewAngleRef
  setViewAngle,
  cubeRef,
}) {
  const stageRef    = useRef(null);
  const cubeElemRef = useRef(null);

  // Keep viewAngle in a ref so camera changes NEVER trigger a rebuild
  const viewAngleRef = useRef({ x: -28, y: -38 });

  // Sync prop → ref whenever parent updates it (e.g. keyboard arrow keys)
  useEffect(() => {
    viewAngleRef.current = viewAngle;
    // Just re-render the cube with the new camera — no rebuild
    renderCubeRef.current?.();
  }, [viewAngle]); // eslint-disable-line react-hooks/exhaustive-deps

  // Mutable internal game state — lives entirely outside React render cycle
  const stateRef = useRef({
    cubies: [],
    queue: [],
    anim: null,
    isScrambling: false,
    moveCount: 0,
  });

  // Stable ref to renderCube so step() can always call the latest version
  const renderCubeRef = useRef(null);

  // -------------------------------------------------------------------
  // Size helper
  // -------------------------------------------------------------------
  const calculateSize = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return 60;
    const minDim = Math.min(window.innerWidth * 0.9, stage.clientHeight * 0.9);
    return Math.max(44, Math.min(96, minDim / (size * 1.7)));
  }, [size]);

  // -------------------------------------------------------------------
  // Solved check
  // -------------------------------------------------------------------
  const checkSolved = useCallback(() => {
    const { cubies } = stateRef.current;
    const map = {};
    for (const c of cubies) {
      for (const [f, n] of c.st) {
        const w = multiplyMatrixVector(c.M, n).join(',');
        if (!map[w]) map[w] = new Set();
        map[w].add(f);
      }
    }
    return Object.values(map).every(s => s.size === 1);
  }, []);

  // -------------------------------------------------------------------
  // renderCube — reads viewAngleRef, never depends on React state
  // -------------------------------------------------------------------
  const renderCube = useCallback(() => {
    const cubeElem = cubeElemRef.current;
    if (!cubeElem) return;

    const s    = calculateSize();
    const anim = stateRef.current.anim;
    const R    = anim ? rotationMatrix(anim.ax, anim.th) : null;
    const { x, y } = viewAngleRef.current;

    cubeElem.style.transform = `rotateX(${x}deg) rotateY(${y}deg)`;

    for (const c of stateRef.current.cubies) {
      const e = c.el;
      if (e._s !== s) {
        e._s = s;
        e.style.width  = `${s}px`;
        e.style.height = `${s}px`;
        e.style.margin = `${-s / 2}px 0 0 ${-s / 2}px`;
        for (const d of e.children) {
          d.style.transform = `${d.dataset.t} translateZ(${s / 2}px)`;
        }
      }

      let A = c.M;
      let t = c.p.map(v => v * s);
      if (R && anim.set.has(c)) {
        A = multiplyMatrices(R, A);
        t = multiplyMatrixVector(R, t);
      }

      e.style.transform = `matrix3d(${[
        A[0][0], A[1][0], A[2][0], 0,
        A[0][1], A[1][1], A[2][1], 0,
        A[0][2], A[1][2], A[2][2], 0,
        t[0],    t[1],    t[2],    1,
      ].join(',')})`;
    }
  }, [calculateSize]); // viewAngle NOT in deps — we use the ref

  // Keep the stable ref in sync
  useEffect(() => {
    renderCubeRef.current = renderCube;
  }, [renderCube]);

  // -------------------------------------------------------------------
  // Animation pump + step
  // -------------------------------------------------------------------
  const pump = useCallback(() => {
    const state = stateRef.current;
    if (state.anim || !state.queue.length) return;

    const [name, inv, fast] = state.queue.shift();
    const [ax, sg]          = MOVE_AXIS_MAP[name];
    const h                 = (size - 1) / 2;

    state.anim = {
      name, inv, ax,
      ang: sg * (inv ? -1 : 1) * Math.PI / 2,
      th:  0,
      t0:  performance.now(),
      dur: fast ? 50 : 160,
      fast,
      set: new Set(state.cubies.filter(c => sg * c.p[ax] >= h - 0.01)),
    };

    const step = (now) => {
      const a = state.anim;
      if (!a) return;

      const u = Math.min(1, (now - a.t0) / a.dur);
      a.th = a.ang * (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2);

      if (u < 1) {
        renderCubeRef.current?.();
        requestAnimationFrame(step);
        return;
      }

      // Commit the rotation to each cubie
      const R = rotationMatrix(a.ax, a.ang);
      for (const c of a.set) {
        c.p = multiplyMatrixVector(R, c.p).map(v => Math.round(v * 2) / 2);
        c.M = multiplyMatrices(R, c.M).map(r => r.map(Math.round));
      }

      const moveNotation = a.name + (a.inv ? "'" : '');
      state.anim = null;

      if (!a.fast) {
        state.moveCount++;
        onMoveCompleted?.(moveNotation, state.moveCount);
      }

      if (!state.queue.length && state.isScrambling) {
        state.isScrambling = false;
        state.moveCount    = 0;
        onScrambleFinish?.();
      }

      renderCubeRef.current?.();

      if (!state.anim && !state.queue.length && !state.isScrambling) {
        if (checkSolved()) onSolved?.(state.moveCount);
      }

      pump();
    };

    requestAnimationFrame(step);
  }, [size, checkSolved, onMoveCompleted, onSolved, onScrambleFinish]);

  // -------------------------------------------------------------------
  // Build / rebuild the DOM cube
  // -------------------------------------------------------------------
  const buildCube = useCallback(() => {
    const cube = cubeElemRef.current;
    if (!cube) return;

    cube.innerHTML = '';
    const state       = stateRef.current;
    state.cubies      = [];
    state.queue       = [];
    state.anim        = null;
    state.isScrambling = false;
    state.moveCount   = 0;

    const h = (size - 1) / 2;
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        for (let k = 0; k < size; k++) {
          const p  = [i - h, j - h, k - h];
          const el = document.createElement('div');
          const st = [];
          el.className = 'cubie';

          for (const { face, normal, transform } of FACES) {
            const d = document.createElement('div');
            d.className = 'face';
            d.dataset.t = transform;
            if (p[0] * normal[0] + p[1] * normal[1] + p[2] * normal[2] >= h - 0.01) {
              d.dataset.f = face;
              st.push([face, normal]);
            }
            el.appendChild(d);
          }

          cube.appendChild(el);
          state.cubies.push({ p, M: IDENTITY_MATRIX, el, st });
        }
      }
    }

    renderCubeRef.current?.();
  }, [size]); // only depends on size — NOT on renderCube or viewAngle

  // -------------------------------------------------------------------
  // Turn API (exposed via cubeRef)
  // -------------------------------------------------------------------
  const turn = useCallback((name, inv = false, fast = false) => {
    stateRef.current.queue.push([name, inv, fast]);
    pump();
  }, [pump]);

  const executeScramble = useCallback((moveList) => {
    stateRef.current.isScrambling = true;
    for (const m of moveList) {
      const inv  = m.endsWith("'");
      const base = m[0];
      turn(base, inv, true);
    }
  }, [turn]);

  // Attach imperative API to cubeRef
  useEffect(() => {
    if (cubeRef) {
      cubeRef.current = {
        turn,
        build: buildCube,
        executeScramble,
        checkSolved,
        isBusy: () => stateRef.current.anim !== null || stateRef.current.queue.length > 0,
      };
    }
  }, [cubeRef, turn, buildCube, executeScramble, checkSolved]);

  // Build once on mount, and again only when size changes
  useEffect(() => {
    buildCube();
  }, [buildCube]);

  // Window resize
  useEffect(() => {
    const onResize = () => renderCubeRef.current?.();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // -------------------------------------------------------------------
  // Pointer drag — updates viewAngleRef directly then re-renders.
  // Also calls setViewAngle so keyboard arrow key state stays in sync.
  // -------------------------------------------------------------------
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    let drag = null;

    const handleDown = (e) => {
      drag = [e.clientX, e.clientY];
    };

    const handleMove = (e) => {
      if (!drag) return;
      const dx = (e.clientX - drag[0]) * 0.5;
      const dy = (e.clientY - drag[1]) * 0.5;
      drag = [e.clientX, e.clientY];

      // Mutate the ref directly — no React state update here
      viewAngleRef.current = {
        x: Math.max(-89, Math.min(89, viewAngleRef.current.x - dy)),
        y: viewAngleRef.current.y + dx,
      };

      // Notify parent so keyboard shortcuts stay in sync (throttled by rAF)
      setViewAngle({ ...viewAngleRef.current });

      renderCubeRef.current?.();
    };

    const handleUp = () => { drag = null; };

    stage.addEventListener('pointerdown', handleDown);
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup',   handleUp);

    return () => {
      stage.removeEventListener('pointerdown', handleDown);
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup',   handleUp);
    };
  }, [setViewAngle]);

  return (
    <div id="stage" ref={stageRef}>
      <div id="cube" ref={cubeElemRef} />
    </div>
  );
}
