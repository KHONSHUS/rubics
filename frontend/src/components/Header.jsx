import React from 'react';

export default function Header({
  size,
  onSizeChange,
  onScramble,
  onReset,
  onOpenStats,
  theme,
  onToggleTheme,
  backendConnected,
}) {
  return (
    <header className="cube-header">
      {/* LEFT — Size selector */}
      <div className="header-section header-left">
        <h1>Cube</h1>
        <div className="bar" role="group" aria-label="Cube Dimensions">
          <button
            className="b"
            aria-pressed={size === 2}
            onClick={() => onSizeChange(2)}
            title="2x2 Rubik's Cube"
          >
            2×2
          </button>
          <button
            className="b"
            aria-pressed={size === 3}
            onClick={() => onSizeChange(3)}
            title="3x3 Rubik's Cube"
          >
            3×3
          </button>
        </div>
        <span
          className={`status-pill ${backendConnected ? 'online' : 'offline'}`}
          title={backendConnected ? 'Python API Connected' : 'Running in Local Mode'}
        >
          {backendConnected ? 'API ON' : 'LOCAL'}
        </span>
      </div>

      {/* CENTRE — Game actions */}
      <div className="header-section header-center">
        <div className="bar" role="group" aria-label="Game Actions">
          <button className="b" onClick={onScramble} title="Scramble Cube">
            Scramble
          </button>
          <button className="b" onClick={onReset} title="Reset to solved state">
            Reset
          </button>
          <button className="b" onClick={onOpenStats} title="View Speedcubing Stats">
            Stats
          </button>
        </div>
      </div>

      {/* RIGHT — Theme toggle */}
      <div className="header-section header-right">
        <div className="bar" role="group" aria-label="Theme Selection">
          <button
            className="b"
            aria-pressed={theme === 'light'}
            onClick={() => onToggleTheme('light')}
            title="Light mode"
          >
            ☀ Light
          </button>
          <button
            className="b"
            aria-pressed={theme === 'dark'}
            onClick={() => onToggleTheme('dark')}
            title="Dark mode"
          >
            ☾ Dark
          </button>
        </div>
      </div>
    </header>
  );
}
