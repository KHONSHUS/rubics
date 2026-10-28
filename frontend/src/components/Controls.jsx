import React from 'react';

const MOVES = ['U', 'D', 'L', 'R', 'F', 'B'];

export default function Controls({
  movesCount,
  status,
  timerSeconds,
  scrambleSequence,
  onTurn,
}) {
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const rem = (secs % 60).toFixed(1);
    return mins > 0 ? `${mins}:${rem < 10 ? '0' : ''}${rem}s` : `${rem}s`;
  };

  return (
    <footer className="cube-footer">
      <div className="info-bar">
        <div className="stat-pill">
          <span className="stat-label">Moves:</span>
          <span className="stat-value">{movesCount}</span>
        </div>

        {timerSeconds !== null && (
          <div className="stat-pill">
            <span className="stat-label">Time:</span>
            <span className="stat-value">{formatTime(timerSeconds)}</span>
          </div>
        )}

        <div className={`status-pill badge-${status.toLowerCase().replace(/[^a-z0-9]/g, '')}`}>
          {status}
        </div>
      </div>

      {scrambleSequence && (
        <div className="scramble-display" title="Current Scramble">
          <span className="scramble-tag">Scramble:</span> {scrambleSequence}
        </div>
      )}

      <div className="keys" role="group" aria-label="Turn Buttons">
        {MOVES.map((m) => (
          <React.Fragment key={m}>
            <button
              className="b turn-btn"
              onClick={() => onTurn(m, false)}
              title={`Turn ${m} face clockwise`}
            >
              {m}
            </button>
            <button
              className="b turn-btn"
              onClick={() => onTurn(m, true)}
              title={`Turn ${m} face counter-clockwise`}
            >
              {m}’
            </button>
          </React.Fragment>
        ))}
      </div>

      <p className="hint">
        <strong>Keys:</strong> <kbd>U</kbd> <kbd>D</kbd> <kbd>L</kbd> <kbd>R</kbd> <kbd>F</kbd> <kbd>B</kbd> (Hold <kbd>Shift</kbd> for counter-clockwise) · <kbd>Arrows</kbd> or drag to rotate view · <kbd>Space</kbd> scramble · <kbd>Esc</kbd> reset
      </p>
    </footer>
  );
}
