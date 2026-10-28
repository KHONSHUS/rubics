import React from 'react';

export default function StatsModal({ isOpen, onClose, stats }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Speedcubing Records</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="stats-grid">
            <div className="stat-card">
              <span className="sc-val">{stats.best_time != null ? `${stats.best_time}s` : '—'}</span>
              <span className="sc-lbl">Best Time</span>
            </div>
            <div className="stat-card">
              <span className="sc-val">{stats.average_time != null ? `${stats.average_time}s` : '—'}</span>
              <span className="sc-lbl">Average</span>
            </div>
            <div className="stat-card">
              <span className="sc-val">{stats.total_solves || 0}</span>
              <span className="sc-lbl">Total Solved</span>
            </div>
          </div>

          <h3 className="section-title">Recent Solves</h3>
          {stats.history && stats.history.length > 0 ? (
            <div className="table-wrapper">
              <table className="stats-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Time</th>
                    <th>Moves</th>
                    <th>Scramble</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.history.map((s, idx) => (
                    <tr key={s.id || idx}>
                      <td>{idx + 1}</td>
                      <td className="highlight-cell">{s.time_seconds}s</td>
                      <td>{s.move_count}</td>
                      <td className="scramble-cell" title={s.scramble}>{s.scramble || '—'}</td>
                      <td>{s.timestamp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="empty-msg">No solves recorded yet. Scramble and solve the cube to set a record!</p>
          )}
        </div>
      </div>
    </div>
  );
}
