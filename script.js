const $ = s => document.querySelector(s);
const I = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
const mul = (A, B) => A.map(r => B[0].map((_, j) => r[0] * B[0][j] + r[1] * B[1][j] + r[2] * B[2][j]));
const mv = (A, v) => A.map(r => r[0] * v[0] + r[1] * v[1] + r[2] * v[2]);
const rot = (ax, a) => {
  const c = Math.cos(a), s = Math.sin(a);
  return ax == 0 ? [[1, 0, 0], [0, c, -s], [0, s, c]]
       : ax == 1 ? [[c, 0, s], [0, 1, 0], [-s, 0, c]]
       :           [[c, -s, 0], [s, c, 0], [0, 0, 1]];
};

const FACES = [
  ['U', [0, -1, 0], 'rotateX(90deg)'],
  ['D', [0, 1, 0], 'rotateX(-90deg)'],
  ['F', [0, 0, 1], ''],
  ['B', [0, 0, -1], 'rotateY(180deg)'],
  ['R', [1, 0, 0], 'rotateY(90deg)'],
  ['L', [-1, 0, 0], 'rotateY(-90deg)']
];
const MV = { U: [1, -1], D: [1, 1], L: [0, -1], R: [0, 1], F: [2, 1], B: [2, -1] };

let N = 3, cubies = [], queue = [], anim = null, count = 0, scr = false;
let view = { x: -28, y: -38 };

const S = () => Math.max(44, Math.min(96, Math.min(innerWidth * .9, $('#stage').clientHeight * .9) / (N * 1.7)));

function build() {
  const cube = $('#cube');
  cube.innerHTML = '';
  cubies = []; queue = []; anim = null; count = 0; scr = false;
  const h = (N - 1) / 2;
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) for (let k = 0; k < N; k++) {
    const p = [i - h, j - h, k - h], el = document.createElement('div'), st = [];
    el.className = 'cubie';
    for (const [f, n, t] of FACES) {
      const d = document.createElement('div');
      d.className = 'face';
      d.dataset.t = t;
      if (p[0] * n[0] + p[1] * n[1] + p[2] * n[2] >= h - .01) {
        d.dataset.f = f;
        st.push([f, n]);
      }
      el.appendChild(d);
    }
    cube.appendChild(el);
    cubies.push({ p, M: I, el, st });
  }
  render();
  status();
}

function render() {
  const s = S(), R = anim ? rot(anim.ax, anim.th) : null;
  $('#cube').style.transform = 'rotateX(' + view.x + 'deg) rotateY(' + view.y + 'deg)';
  for (const c of cubies) {
    const e = c.el;
    if (e._s !== s) {
      e._s = s;
      e.style.width = e.style.height = s + 'px';
      e.style.margin = (-s / 2) + 'px 0 0 ' + (-s / 2) + 'px';
      for (const d of e.children) d.style.transform = d.dataset.t + ' translateZ(' + (s / 2) + 'px)';
    }
    let A = c.M, t = c.p.map(v => v * s);
    if (R && anim.set.has(c)) { A = mul(R, A); t = mv(R, t); }
    e.style.transform = 'matrix3d(' + [
      A[0][0], A[1][0], A[2][0], 0,
      A[0][1], A[1][1], A[2][1], 0,
      A[0][2], A[1][2], A[2][2], 0,
      t[0], t[1], t[2], 1
    ].join(',') + ')';
  }
}

function pump() {
  if (anim || !queue.length) return;
  const [name, inv, fast] = queue.shift(), [ax, sg] = MV[name], h = (N - 1) / 2;
  anim = {
    ax, ang: sg * (inv ? -1 : 1) * Math.PI / 2, th: 0,
    t0: performance.now(), dur: fast ? 60 : 170, fast,
    set: new Set(cubies.filter(c => sg * c.p[ax] >= h - .01))
  };
  requestAnimationFrame(step);
}

function step(now) {
  const a = anim, u = Math.min(1, (now - a.t0) / a.dur);
  a.th = a.ang * (u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2);
  if (u < 1) { render(); requestAnimationFrame(step); return; }
  const R = rot(a.ax, a.ang);
  for (const c of a.set) {
    c.p = mv(R, c.p).map(v => Math.round(v * 2) / 2);
    c.M = mul(R, c.M).map(r => r.map(Math.round));
  }
  anim = null;
  if (!a.fast) count++;
  if (!queue.length && scr) { scr = false; count = 0; }
  render(); status(); pump();
}

function solved() {
  const m = {};
  for (const c of cubies) for (const [f, n] of c.st) {
    const w = mv(c.M, n).join();
    (m[w] = m[w] || new Set()).add(f);
  }
  return Object.values(m).every(s => s.size == 1);
}

function status() {
  const idle = !scr && !anim && !queue.length;
  $('#moves').textContent = count;
  $('#st').textContent = scr ? 'Scrambling…' : idle && count > 0 && solved() ? 'Solved!' : count ? 'Playing' : 'Ready';
  document.querySelectorAll('#sizes .b').forEach(b => b.setAttribute('aria-pressed', b.dataset.n == N));
}

const turn = (n, inv) => { queue.push([n, inv, false]); pump(); };

function scramble() {
  if (scr) return;
  scr = true;
  let n = N == 2 ? 11 : 22, last = '';
  while (n--) {
    let m;
    do m = 'UDLRFB'[Math.random() * 6 | 0]; while (m == last);
    last = m;
    queue.push([m, Math.random() < .5, true]);
  }
  pump();
  status();
}

function setTheme(t) {
  document.documentElement.dataset.theme = t;
  document.querySelectorAll('#themes .b').forEach(b => b.setAttribute('aria-pressed', b.dataset.th == t));
  try { localStorage.setItem('cube-theme', t); } catch (e) {}
}

$('#sizes').onclick = e => { const n = e.target.dataset.n; if (n) { N = +n; build(); } };
$('#themes').onclick = e => { const t = e.target.dataset.th; if (t) setTheme(t); };
$('#scr').onclick = scramble;
$('#rst').onclick = build;

for (const m of 'UDLRFB') for (const inv of [false, true]) {
  const b = document.createElement('button');
  b.className = 'b';
  b.textContent = m + (inv ? '’' : '');
  b.onclick = () => turn(m, inv);
  $('#keys').appendChild(b);
}

addEventListener('keydown', e => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.key.toUpperCase();
  if (MV[k] && e.key.length == 1) { turn(k, e.shiftKey); return; }
  if (e.key == 'ArrowLeft') view.y -= 15;
  else if (e.key == 'ArrowRight') view.y += 15;
  else if (e.key == 'ArrowUp') view.x = Math.min(89, view.x + 15);
  else if (e.key == 'ArrowDown') view.x = Math.max(-89, view.x - 15);
  else if (e.key == ' ') scramble();
  else if (e.key == 'Escape') build();
  else return;
  e.preventDefault();
  render();
});

let drag = null;
$('#stage').addEventListener('pointerdown', e => { drag = [e.clientX, e.clientY]; });
addEventListener('pointermove', e => {
  if (!drag) return;
  view.y += (e.clientX - drag[0]) * .5;
  view.x = Math.max(-89, Math.min(89, view.x - (e.clientY - drag[1]) * .5));
  drag = [e.clientX, e.clientY];
  render();
});
addEventListener('pointerup', () => { drag = null; });
addEventListener('resize', render);

let th = 'light';
try { th = localStorage.getItem('cube-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'); } catch (e) {}
setTheme(th === 'dark' ? 'dark' : 'light');
build();
