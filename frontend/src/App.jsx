import React, { useState, useEffect, useRef, useCallback } from 'react';
import Header from './components/Header';
import CubeStage from './components/CubeStage';
import Controls from './components/Controls';
import StatsModal from './components/StatsModal';
import {
  checkHealth,
  sendBackendMove,
  resetBackendCube,
  fetchScrambleSequence,
  recordSolveRecord,
  fetchSessionStats,
} from './utils/api';
import './App.css';

const LOCAL_STORAGE_THEME_KEY = 'cube-theme';

export default function App() {
  const [size, setSize] = useState(3);
  const [movesCount, setMovesCount] = useState(0);
  const [status, setStatus] = useState('Ready');
  const [scrambleStr, setScrambleStr] = useState('');
  const [viewAngle, setViewAngle] = useState({ x: -28, y: -38 });
  const [backendConnected, setBackendConnected] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [statsData, setStatsData] = useState({ total_solves: 0, best_time: null, average_time: null, history: [] });
  const [toast, setToast] = useState(null);

  // Timer state
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(null);
  const timerStartRef = useRef(null);
  const timerIntervalRef = useRef(null);

  const cubeRef = useRef(null);
  const moveHistoryRef = useRef([]);
  const toastTimerRef = useRef(null);

  // Show a non-blocking toast notification
  const showToast = useCallback((msg, type = 'info', durationMs = 2800) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ msg, type });
    toastTimerRef.current = setTimeout(() => setToast(null), durationMs);
  }, []);

  // Theme setup
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_THEME_KEY);
      if (saved) return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(LOCAL_STORAGE_THEME_KEY, theme);
    } catch {}
  }, [theme]);

  // Backend connection check
  const verifyBackend = useCallback(async () => {
    const ok = await checkHealth();
    setBackendConnected(ok);
    if (ok) {
      const stats = await fetchSessionStats();
      if (stats) setStatsData(stats);
    }
  }, []);

  useEffect(() => {
    verifyBackend();
    const interval = setInterval(verifyBackend, 12000);
    return () => clearInterval(interval);
  }, [verifyBackend]);

  // Timer controls
  const startTimer = useCallback(() => {
    timerStartRef.current = performance.now();
    setTimerSeconds(0);
    setTimerRunning(true);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    timerIntervalRef.current = setInterval(() => {
      if (timerStartRef.current) {
        const elapsed = (performance.now() - timerStartRef.current) / 1000;
        setTimerSeconds(elapsed);
      }
    }, 100);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setTimerRunning(false);
    if (timerStartRef.current) {
      const finalTime = (performance.now() - timerStartRef.current) / 1000;
      setTimerSeconds(finalTime);
      return finalTime;
    }
    return null;
  }, []);

  const resetTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    timerStartRef.current = null;
    setTimerRunning(false);
    setTimerSeconds(null);
  }, []);

  // Handle solved detection
  const handleSolved = useCallback(
    async (finalMoves) => {
      setStatus('Solved!');
      const elapsed = stopTimer();

      if (elapsed && finalMoves > 0 && backendConnected) {
        await recordSolveRecord(elapsed, finalMoves, scrambleStr);
        const stats = await fetchSessionStats();
        if (stats) setStatsData(stats);
      }
    },
    [stopTimer, scrambleStr, backendConnected]
  );

  // Handle move completion for Cube
  const handleMoveCompleted = useCallback(
    (moveNotation, newCount) => {
      setMovesCount(newCount);
      setStatus('Playing');
      moveHistoryRef.current.push(moveNotation);

      if (!timerRunning && timerStartRef.current === null && scrambleStr) {
        startTimer();
      }

      if (backendConnected) {
        sendBackendMove(moveNotation).catch(() => {});
      }
    },
    [timerRunning, scrambleStr, startTimer, backendConnected]
  );

  // Face turn action
  const handleTurn = useCallback((face, inv) => {
    cubeRef.current?.turn(face, inv, false);
  }, []);

  // Scramble cube
  const handleScramble = useCallback(async () => {
    if (cubeRef.current?.isBusy()) return;
    setStatus('Scrambling…');
    resetTimer();

    let sequence = [];
    if (backendConnected) {
      const res = await fetchScrambleSequence(size === 2 ? 11 : 22);
      if (res && res.scramble_sequence) {
        sequence = res.scramble_sequence;
      }
    }

    if (!sequence.length) {
      let n = size === 2 ? 11 : 22;
      let last = '';
      while (n--) {
        let m;
        do {
          m = 'UDLRFB'[(Math.random() * 6) | 0];
        } while (m === last);
        last = m;
        sequence.push(m + (Math.random() < 0.5 ? "'" : ''));
      }
    }

    setScrambleStr(sequence.join(' '));
    moveHistoryRef.current = [];
    cubeRef.current?.executeScramble(sequence);
  }, [backendConnected, size, resetTimer]);

  const handleScrambleFinish = useCallback(() => {
    setStatus('Ready');
    setMovesCount(0);
    moveHistoryRef.current = [];
  }, []);

  // Reset cube
  const handleReset = useCallback(async () => {
    resetTimer();
    setMovesCount(0);
    setScrambleStr('');
    setStatus('Ready');
    moveHistoryRef.current = [];
    cubeRef.current?.build();
    if (backendConnected) {
      await resetBackendCube(size);
    }
  }, [resetTimer, backendConnected, size]);

  // Size change (2x2 or 3x3)
  const handleSizeChange = useCallback(
    (newSize) => {
      if (newSize === size) return;
      setSize(newSize);
      resetTimer();
      setMovesCount(0);
      setScrambleStr('');
      setStatus('Ready');
      moveHistoryRef.current = [];
      if (backendConnected) {
        resetBackendCube(newSize);
      }
    },
    [size, resetTimer, backendConnected]
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (statsOpen) return;

      const k = e.key.toUpperCase();
      if ('UDLRFB'.includes(k) && e.key.length === 1) {
        e.preventDefault();
        handleTurn(k, e.shiftKey);
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setViewAngle((prev) => ({ ...prev, y: prev.y - 15 }));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setViewAngle((prev) => ({ ...prev, y: prev.y + 15 }));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setViewAngle((prev) => ({ ...prev, x: Math.min(89, prev.x + 15) }));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setViewAngle((prev) => ({ ...prev, x: Math.max(-89, prev.x - 15) }));
      } else if (e.key === ' ') {
        e.preventDefault();
        handleScramble();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleReset();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTurn, handleScramble, handleReset, statsOpen]);

  return (
    <div className="app-container">
      <Header
        size={size}
        onSizeChange={handleSizeChange}
        onScramble={handleScramble}
        onReset={handleReset}
        onOpenStats={() => setStatsOpen(true)}
        theme={theme}
        onToggleTheme={setTheme}
        backendConnected={backendConnected}
      />

      <CubeStage
        size={size}
        onMoveCompleted={handleMoveCompleted}
        onSolved={handleSolved}
        onScrambleFinish={handleScrambleFinish}
        viewAngle={viewAngle}
        setViewAngle={setViewAngle}
        cubeRef={cubeRef}
      />

      <Controls
        movesCount={movesCount}
        status={status}
        timerSeconds={timerSeconds}
        scrambleSequence={scrambleStr}
        onTurn={handleTurn}
      />

      <StatsModal
        isOpen={statsOpen}
        onClose={() => setStatsOpen(false)}
        stats={statsData}
      />

      {/* Toast notification */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
