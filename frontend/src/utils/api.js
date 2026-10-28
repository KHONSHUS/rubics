// API Client to interact with Python FastAPI backend

const API_BASE_URL =
  typeof window !== 'undefined' && window.location.port === '5173'
    ? 'http://localhost:8000/api'
    : '/api';

async function request(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    });
    if (!res.ok) {
      throw new Error(`API error: ${res.statusText}`);
    }
    return await res.json();
  } catch (err) {
    // Return null or rethrow for graceful fallback
    return null;
  }
}

export const checkHealth = async () => {
  const data = await request('/health');
  return data !== null;
};

export const fetchState = () => request('/state');

export const resetBackendCube = (size = 3) =>
  request('/reset', {
    method: 'POST',
    body: JSON.stringify({ size }),
  });

export const sendBackendMove = (move) =>
  request('/move', {
    method: 'POST',
    body: JSON.stringify({ move }),
  });

export const fetchScrambleSequence = (length) =>
  request('/scramble', {
    method: 'POST',
    body: JSON.stringify({ length, apply_to_state: true }),
  });

export const fetchSolveSequence = () => request('/solve');

export const recordSolveRecord = (timeSeconds, moveCount, scramble = '') =>
  request('/session/record', {
    method: 'POST',
    body: JSON.stringify({
      time_seconds: timeSeconds,
      move_count: moveCount,
      scramble,
    }),
  });

export const fetchSessionStats = () => request('/session/stats');
