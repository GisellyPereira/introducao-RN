import './style.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { criarJovem } from './rig.js';
import { criarCortina } from './tecido.js';

gsap.registerPlugin(ScrollTrigger);
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ramp = (p, a, b) => { const t = clamp((p - a) / (b - a)); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const narrow = () => innerWidth <= 820;

/* ---------------- Scroll ---------------- */
let lenis = null;
if (!reduced) {
  lenis = new Lenis({ duration: 1.15, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
$$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
  const t = a.getAttribute('href').length > 1 && $(a.getAttribute('href'));
  if (!t) return;
  e.preventDefault();
  lenis ? lenis.scrollTo(t, { duration: 2.4 }) : t.scrollIntoView({ behavior: 'smooth' });
}));

/* ---------------- Referências ---------------- */
const film = $('[data-film]');
const sc = Object.fromEntries($$('[data-sc]').map((n) => [n.dataset.sc, n]));
const T = Object.fromEntries($$('[data-t]').map((n) => [n.dataset.t, n]));
const E = {
  youth: $('[data-youth]'), heroCurtain: $('.hero__curtain'), fxCurtain: $('[data-fx-curtain]'), sash: $('[data-fx-sash]'),
  graft: $('[data-graft]'), tree: $('[data-tree]'), hand: $('[data-hand]'), treeDark: $('[data-tree-dark]'),
  portrait: $('[data-portrait]'), halves: $('[data-halves]'), hl: $('.halves__l'), hr: $('.halves__r'),
  clouds: $$('[data-cloud]'), ruler: $('[data-ruler]'), skyPear: $('[data-sky-pear]'),
  perona: $('[data-perona]'), andaime: $('[data-andaime]'), plate: $('[data-plate]'),
  wave: $('[data-wave]'), woman: $('[data-woman]'), falling: $('[data-falling]'),
  branches: $('[data-branches]'), qs: $$('[data-q]'), askLines: $('[data-ask-lines]'),
  label: $('[data-label]'), mid: $('.chrome__guide--mid'),
};

/* Jovem articulado: a fase da caminhada vem da distância percorrida, então o passo
   acompanha o deslocamento (sem patinar) e ele para na pose da pintura quando o scroll para */
const jovem = criarJovem(E.youth);
const cortina = criarCortina(E.fxCurtain, E.heroCurtain);
let sopro = 0; // a cortina balança quando o jovem passa por ela
const walk = { x: null, t: 0, fase: 0.25, amp: 0, intro: 0 };
function andar(x, time) {
  const unit = E.youth.getBoundingClientRect().height / 1170; // px por unidade da imagem-mãe
  if (walk.x === null) walk.x = x;
  const dx = x - walk.x, dt = Math.max(1 / 120, time - walk.t || 1 / 60);
  walk.x = x; walk.t = time;
  walk.fase += -dx / (400 * unit); // 400 unidades = dois passos
  const alvo = clamp(Math.abs(dx / dt) / (330 * unit));
  walk.amp += (alvo - walk.amp) * (alvo > walk.amp ? 0.25 : 0.08);
  // ao parar, termina o passo até a pose de repouso (pernas juntas) em vez de congelar no meio
  if (walk.amp < 0.02) { walk.amp = 0; walk.fase = Math.round(walk.fase * 2) / 2; }
  E.youth.style.translate = `${x.toFixed(1)}px 0`;
  jovem.pose(walk.fase, walk.amp);
  // empurrão na cortina: forte enquanto ele ainda está saindo, depois assenta devagar
  sopro += ((walk.intro > innerWidth * 0.08 ? 1 : 0) - sopro) * 0.04;
  if (cortina && E.heroCurtain.style.opacity !== '0') cortina.desenhar(time, sopro);
}

const on = (name, v) => sc[name].classList.toggle('on', v);
const fade = (node, o, dy = 18) => {
  node.style.opacity = o;
  node.style.translate = `0 ${(1 - o) * dy}px`;
  node.style.visibility = o > 0.01 ? 'visible' : 'hidden';
};
const win = (p, a, b, c, d) => ramp(p, a, b) * (1 - ramp(p, c, d));

// Régua com marcações no céu
for (let i = 0; i < 9; i++) { const t = document.createElement('i'); E.ruler.appendChild(t); }
const ticks = $$('i', E.ruler);

// Peras caindo (em retícula)
const PEARS = Array.from({ length: 16 }, (_, i) => {
  const img = document.createElement('img');
  img.src = '/img/pera-ht.webp';
  img.alt = '';
  E.falling.appendChild(img);
  return { img, x: 4 + Math.random() * 44, y0: -20 - Math.random() * 90, speed: 220 + Math.random() * 260, s: 0.6 + Math.random() * 0.9, r: (Math.random() - 0.5) * 80 };
});

// Linhas tracejadas entre as perguntas
const NS = 'http://www.w3.org/2000/svg';
const qLines = [[0, 1], [1, 2], [1, 3]].map(() => { const l = document.createElementNS(NS, 'line'); E.askLines.appendChild(l); return l; });
function placeQLines() {
  const r = sc.ask.getBoundingClientRect();
  const pts = E.qs.map((q) => { const b = q.getBoundingClientRect(); return [((b.left - r.left) / r.width) * 100 - 0.6, ((b.top - r.top) / r.height) * 100 + 1.2]; });
  [[0, 1], [1, 2], [1, 3]].forEach(([a, b], i) => {
    qLines[i].setAttribute('x1', pts[a][0]); qLines[i].setAttribute('y1', pts[a][1]);
    qLines[i].setAttribute('x2', pts[b][0]); qLines[i].setAttribute('y2', pts[b][1]);
  });
}

/* ---------------- Onda em retícula ---------------- */
const wave = (() => {
  const c = E.wave, ctx = c.getContext('2d');
  let w, h, cell, cols, rows, N, last = -1;
  const setup = () => {
    const r = c.getBoundingClientRect(); w = r.width; h = r.height;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    c.width = w * dpr; c.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cell = narrow() ? 8 : 9; cols = Math.ceil(w / cell); rows = Math.ceil(h / cell);
    N = new Float32Array(cols * rows);
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) N[y * cols + x] = (Math.sin(x * 0.21) + Math.sin(x * 0.07 + y * 0.05) + Math.sin(x * 0.13 - y * 0.3)) / 6 + 0.5 + Math.random() * 0.12;
    last = -1;
  };
  setup();
  addEventListener('resize', setup);
  return (t) => {
    if (Math.abs(t - last) < 0.003) return;
    last = t;
    ctx.clearRect(0, 0, w, h);
    if (t <= 0) return;
    ctx.fillStyle = '#1d5fe0';
    for (let y = 0; y < rows; y++) {
      const fromBottom = 1 - y / rows;
      for (let x = 0; x < cols; x++) {
        const local = clamp((t * 1.9 - fromBottom * 1.1 - N[y * cols + x] * 0.45) / 0.2);
        if (local <= 0) continue;
        if (local >= 1) { ctx.fillRect(x * cell, y * cell, cell + 0.6, cell + 0.6); continue; }
        ctx.beginPath();
        ctx.arc(x * cell + cell / 2, y * cell + cell / 2, cell * 0.75 * local, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };
})();

/* ---------------- Linha do tempo ---------------- */
let progress = 0;
ScrollTrigger.create({ trigger: film, start: 'top top', end: 'bottom bottom', scrub: true, onUpdate: (s) => { progress = s.progress; } });

const LABELS = [[0.09, '— O modelo'], [0.43, '— A busca'], [0.52, '— A obra'], [0.635, '— Os termos'], [0.765, '— Para quem'], [0.85, '— Perguntas']];
let lastLabel = '';

function render(p, time) {
  const vw = innerWidth, vh = innerHeight, m = narrow();

  /* 1 — herói (0 → 0.09) */
  on('hero', p < 0.095);
  fade(T.hero, 1 - ramp(p, 0.015, 0.04));
  fade(T['hero-below'], 1 - ramp(p, 0.015, 0.04));
  andar(lerp(0, -0.16, ramp(p, 0, 0.05)) * vw + walk.intro, time);
  // A cortina fecha por cima dele e toma a tela inteira (com zoom na trama)
  const cc = ramp(p, 0.025, 0.088);
  E.fxCurtain.style.opacity = (p > 0.024 && p < 0.115) ? 1 - ramp(p, 0.098, 0.112) : 0;
  E.heroCurtain.style.opacity = p > 0.024 ? 0 : 1;
  const base = E.fxCurtain.naturalWidth ? (vh * 1.08) * (E.fxCurtain.naturalWidth / E.fxCurtain.naturalHeight) : vw * 0.33;
  const s = lerp(1, Math.max(5.2, (vw * 1.6) / base), cc);
  E.fxCurtain.style.transform = `translate(${vw - base * s + lerp(0, base * s * 0.35, cc)}px, ${-0.05 * vh - (s - 1) * vh * 0.54}px) scale(${s})`;
  // Faixa bege atravessa na diagonal
  const sa = ramp(p, 0.085, 0.135);
  E.sash.style.opacity = sa > 0 && sa < 1 ? 1 : 0;
  E.sash.style.transform = `translate(${lerp(-1.25, 0.55, sa) * vw}px, ${lerp(0.55, -0.85, sa) * vh}px) rotate(-6deg)`;

  /* 2 — enxerto (0.09 → 0.21) */
  on('graft', p >= 0.09 && p < 0.225);
  E.graft.style.opacity = ramp(p, 0.1, 0.125);
  E.graft.style.transform = `scale(${lerp(1.18, 1, ramp(p, 0.1, 0.2))})`;

  /* 3 — pereira (0.19 → 0.33) */
  on('tree', p >= 0.19 && p < 0.335);
  sc.tree.style.opacity = ramp(p, 0.19, 0.215);
  const tz = ramp(p, 0.3, 0.33);
  E.tree.style.transformOrigin = '50% 62%';
  E.tree.style.transform = `scale(${lerp(1.12, 1, ramp(p, 0.19, 0.3)) * lerp(1, 2.3, tz)})`;
  E.treeDark.style.opacity = ramp(p, 0.312, 0.332);
  fade(T.build, win(p, 0.215, 0.235, 0.255, 0.265));
  fade(T['build-below'], win(p, 0.22, 0.24, 0.255, 0.265));
  E.hand.style.transform = `translateY(${lerp(100, 0, ramp(p, 0.245, 0.282))}%) translateY(${-tz * 30}vh)`;
  fade(T.rank, win(p, 0.268, 0.282, 0.298, 0.31));
  fade(T['rank-below'], win(p, 0.272, 0.286, 0.298, 0.31));

  /* 4 — retrato e a pera partida (0.32 → 0.43) */
  on('portrait', p >= 0.32 && p < 0.435);
  sc.portrait.style.opacity = ramp(p, 0.322, 0.338);
  fade(T.share, win(p, 0.338, 0.352, 0.368, 0.378));
  fade(T['share-below'], win(p, 0.342, 0.356, 0.368, 0.378));
  E.halves.style.opacity = ramp(p, 0.374, 0.39);
  E.portrait.style.opacity = 1 - ramp(p, 0.39, 0.395);
  sc.portrait.style.background = p > 0.392 ? 'var(--azul)' : '';
  const sp = ramp(p, 0.4, 0.432);
  E.hl.style.transform = `translateX(${-sp * 62}vw)`;
  E.hr.style.transform = `translateX(${sp * 62}vw)`;

  /* 5 — céu (0.425 → 0.54) */
  on('sky', p >= 0.425 && p < 0.545);
  const sk = (p - 0.425) / 0.12;
  const cl = m
    ? [[50, 68, -40], [8, 22, -55], [62, 6, -30], [-10, 86, -70]]
    : [[68, 58, -45], [30, 26, -60], [6, -6, -30], [86, 84, -80]];
  E.clouds.forEach((c, i) => { c.style.transform = `translate(${cl[i][0]}vw, ${cl[i][1] + sk * cl[i][2]}vh)`; });
  ticks.forEach((t, i) => { const y = ((i * 11 + sk * 60) % 100); t.style.top = `${y}%`; t.style.width = i % 3 === 0 ? '24px' : '12px'; });
  fade(T.sky, win(p, 0.44, 0.455, 0.505, 0.515));
  const pr = ramp(p, 0.49, 0.545);
  E.skyPear.style.transform = `translateY(${lerp(0, -70, pr)}vh) scale(${lerp(1, 4.2, ramp(p, 0.515, 0.545))})`;
  E.skyPear.style.transformOrigin = '50% 70%';

  /* 6 — a obra (0.525 → 0.64) */
  on('build', p >= 0.525 && p < 0.645);
  sc.build.style.opacity = ramp(p, 0.528, 0.542);
  E.perona.style.transform = `scale(${lerp(1.18, 1, ramp(p, 0.528, 0.575))})`;
  fade(T['build-col'], win(p, 0.545, 0.558, 0.574, 0.582));
  E.andaime.style.opacity = ramp(p, 0.576, 0.592);
  const bz = ramp(p, 0.608, 0.64);
  E.andaime.style.transformOrigin = '27% 52%';
  E.andaime.style.transform = `translateX(${lerp(5, 0, ramp(p, 0.576, 0.6))}vw) scale(${lerp(1, 3.4, bz)})`;

  /* 7 — termos: a gravura deita até ficar vista de cima (0.625 → 0.77) */
  on('terms', p >= 0.625 && p < 0.775);
  sc.terms.style.opacity = ramp(p, 0.626, 0.642);
  const pl = ramp(p, 0.64, 0.685);
  const plW = E.plate.getBoundingClientRect().width || vw * 0.38;
  const cx = m ? 0 : (vw / 2 - (vw * 0.06 + plW / 2)) * (1 - pl);
  E.plate.style.transform = `translate(${m ? '-50%' : '0'}, -50%) translateX(${cx}px) perspective(1400px) rotateX(${lerp(64, 0, pl)}deg) rotateZ(${lerp(-24, 0, pl)}deg) scale(${lerp(1.6, 1, pl)})`;
  if (m) E.plate.style.top = '26vh';
  fade(T.terms, win(p, 0.67, 0.69, 0.738, 0.75));

  /* Onda em retícula sobe (0.73 → 0.775) */
  const wt = ramp(p, 0.73, 0.775);
  E.wave.style.display = p > 0.72 && p < 0.78 ? 'block' : 'none';
  if (p > 0.72 && p < 0.78) wave(wt);

  /* 8 — dizemos não (0.77 → 0.865) */
  on('no', p >= 0.77 && p < 0.87);
  E.woman.style.transform = `translateY(${lerp(6, 0, ramp(p, 0.77, 0.8))}vh)`;
  PEARS.forEach((q) => {
    const y = q.y0 + (p - 0.77) * q.speed * 10;
    q.img.style.transform = `translate(${q.x}vw, ${y}vh) rotate(${q.r + y * 0.6}deg) scale(${q.s})`;
  });
  fade(T.no, win(p, 0.785, 0.8, 0.845, 0.855));
  fade(T['no-below'], win(p, 0.79, 0.805, 0.845, 0.855));

  /* 9 — perguntas antes de assinar (0.85 → 1) */
  on('ask', p >= 0.85);
  sc.ask.style.opacity = ramp(p, 0.852, 0.868);
  const zo = ramp(p, 0.955, 1);
  E.branches.style.transform = `scale(${lerp(1.35, 1, ramp(p, 0.852, 0.885)) * lerp(1, 2.4, zo)})`;
  E.branches.style.opacity = 1 - ramp(p, 0.965, 0.995);
  fade(T.ask, win(p, 0.868, 0.882, 0.955, 0.97));
  E.qs.forEach((q, i) => fade(q, win(p, 0.885 + i * 0.016, 0.897 + i * 0.016, 0.955, 0.97), 12));
  qLines.forEach((l, i) => { l.style.opacity = win(p, 0.9 + i * 0.016, 0.91 + i * 0.016, 0.955, 0.97); });

  /* Moldura: cor, rótulo e guia do meio */
  const light = (p >= 0.1 && p < 0.205) || (p >= 0.335 && p < 0.39) || (p >= 0.635 && p < 0.748);
  document.body.classList.toggle('t-light', light);
  document.body.classList.toggle('t-dark', !light);
  let label = '';
  LABELS.forEach(([a, t]) => { if (p >= a) label = t; });
  if (label !== lastLabel) { E.label.textContent = label; lastLabel = label; }
  E.mid.style.opacity = p < 0.425 ? 1 : 0;
}

let filmVisible = true;
new IntersectionObserver(([e]) => { filmVisible = e.isIntersecting; }).observe(film);
gsap.ticker.add((time) => { if (filmVisible) render(progress, time); });
addEventListener('resize', placeQLines);
addEventListener('load', () => { placeQLines(); ScrollTrigger.refresh(); });
setTimeout(placeQLines, 600);
ScrollTrigger.create({ trigger: '.apply', start: 'top 60%', onEnter: () => { E.label.textContent = ''; }, onLeaveBack: () => { lastLabel = ''; } });

// Entrada: o jovem sai de trás da cortina
if (!reduced) {
  walk.intro = innerWidth * 0.3;
  gsap.to(walk, { intro: 0, duration: 3.2, ease: 'sine.out', delay: 0.2 });
  gsap.from([...T.hero.children, T['hero-below']], { opacity: 0, y: 14, duration: 1.1, ease: 'power3.out', stagger: 0.08, delay: 0.45, clearProps: 'transform' });
}

/* ---------------- Constelação + formulário ---------------- */
const sky = $('[data-stars]');
const STARS = [[190, 228, 7], [300, 192, 13], [470, 168, 8], [672, 155, 14], [300, 300, 9], [258, 352, 7], [340, 330, 6], [372, 412, 9], [312, 420, 6], [560, 262, 5], [840, 222, 6], [900, 120, 5], [1000, 300, 7], [760, 380, 5], [1160, 210, 5], [520, 470, 4]];
const LINKS = [[0, 1], [1, 2], [2, 3], [1, 4], [4, 5], [4, 6], [6, 7], [7, 8], [3, 10]];
sky.innerHTML = `<defs><radialGradient id="glow"><stop offset="0" stop-color="#fff" stop-opacity="1"/><stop offset="0.18" stop-color="#fff6d8" stop-opacity="0.9"/><stop offset="0.5" stop-color="#ffe9a8" stop-opacity="0.25"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>`;
const lines = LINKS.map(([a, b]) => {
  const l = document.createElementNS(NS, 'line');
  l.setAttribute('class', 'ln');
  l.setAttribute('x1', STARS[a][0]); l.setAttribute('y1', STARS[a][1]); l.setAttribute('x2', STARS[b][0]); l.setAttribute('y2', STARS[b][1]);
  const len = Math.hypot(STARS[b][0] - STARS[a][0], STARS[b][1] - STARS[a][1]);
  l.style.strokeDasharray = len; l.style.strokeDashoffset = reduced ? 0 : len;
  sky.appendChild(l);
  return l;
});
const stars = STARS.map(([x, y, r]) => {
  const g = document.createElementNS(NS, 'circle');
  g.setAttribute('cx', x); g.setAttribute('cy', y); g.setAttribute('r', r * 2.6); g.setAttribute('fill', 'url(#glow)');
  sky.appendChild(g);
  return g;
});
for (let i = 0; i < 40; i++) {
  const d = document.createElementNS(NS, 'circle');
  d.setAttribute('cx', Math.random() * 1440); d.setAttribute('cy', Math.random() * 900); d.setAttribute('r', (Math.random() * 1.2 + 0.5).toFixed(1));
  d.setAttribute('fill', 'rgba(255,255,255,0.55)');
  sky.appendChild(d);
}
if (!reduced) {
  ScrollTrigger.create({
    trigger: '.apply', start: 'top 70%', once: true,
    onEnter: () => {
      gsap.from(stars, { attr: { r: 0 }, duration: 0.8, ease: 'back.out(2)', stagger: 0.05 });
      gsap.to(lines, { strokeDashoffset: 0, duration: 0.8, ease: 'power2.inOut', stagger: 0.1, delay: 0.3 });
      gsap.from('.apply__form > *', { opacity: 0, y: 16, duration: 0.9, ease: 'power3.out', stagger: 0.1, delay: 0.5 });
    },
  });
}

const form = $('[data-form]');
const msg = $('[data-msg]');
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const nome = form.nome.value.trim(), email = form.email.value.trim(), oque = form.crescer.value.trim();
  const ok = /^\S+@\S+\.\S+$/.test(email);
  form.nome.setAttribute('aria-invalid', String(!nome));
  form.email.setAttribute('aria-invalid', String(!ok));
  form.crescer.setAttribute('aria-invalid', String(!oque));
  if (!nome || !ok || !oque) {
    msg.textContent = !nome ? 'Escreva seu nome.' : !ok ? 'Confira o e-mail de trabalho.' : 'Conte o que você quer fazer crescer.';
    return;
  }
  msg.textContent = `Candidatura enviada, ${nome.split(' ')[0]}. Respondemos em até uma semana. (Site de demonstração: nada foi enviado.)`;
  form.reset();
});
