import './style.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
// 0 antes de a, 1 depois de b, suave no meio
const ramp = (p, a, b) => { const t = clamp((p - a) / (b - a)); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const narrow = () => innerWidth <= 820;

/* ---------------- Scroll ---------------- */
let lenis = null;
if (!reduced) {
  lenis = new Lenis({ duration: 1.2, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
const scrollToY = (y) => (lenis ? lenis.scrollTo(y, { duration: 2.2 }) : window.scrollTo({ top: y, behavior: 'smooth' }));
$$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
  const film = $('[data-film]');
  if (a.hasAttribute('data-skip')) {
    e.preventDefault();
    scrollToY(film.offsetTop + (film.offsetHeight - innerHeight) * 0.24);
    return;
  }
  const t = a.getAttribute('href').length > 1 && $(a.getAttribute('href'));
  if (!t) return;
  e.preventDefault();
  scrollToY(t.offsetTop);
}));

/* ---------------- Elementos do filme ---------------- */
const film = $('[data-film]');
const scenes = Object.fromEntries($$('[data-scene]').map((el) => [el.dataset.scene, el]));
const copy = Object.fromEntries($$('[data-copy]').map((el) => [el.dataset.copy, el]));
const el = {
  figure: $('.s-hero__figure'), drape: $('.s-hero__drape'),
  tree: $('[data-tree]'), pick: $('[data-pick]'), veil: $('.s-tree__veil'),
  portraitImg: $('.s-portrait img'),
  raft: $('[data-raft]'), skyBg: $('.s-sky__bg'),
  dome: $('[data-dome]'),
  cloth: $('[data-cloth]'), sweep: $('[data-sweep]'),
  bar: $('[data-bar]'),
};

const showCopy = (node, p, inA, inB, outA, outB) => {
  const o = ramp(p, inA, inB) * (1 - ramp(p, outA, outB));
  node.style.opacity = o;
  const base = node.classList.contains('copy--sky') || narrow() ? '' : 'translateY(-50%) ';
  node.style.transform = `${base}translateY(${(1 - o) * 28}px)`;
  node.style.visibility = o > 0.01 ? 'visible' : 'hidden';
};
const on = (name, v) => scenes[name].classList.toggle('on', v);

/* ---------------- Retícula (dissolução em pontos) ---------------- */
const dither = (() => {
  const canvas = $('[data-dither]');
  const ctx = canvas.getContext('2d');
  let cols = 0, rows = 0, cell = 8, A = null, B = null, N = null, w = 0, h = 0;
  const sample = (img, pos = [0.5, 0.5]) => {
    const c = document.createElement('canvas');
    c.width = cols; c.height = rows;
    const g = c.getContext('2d');
    const ir = img.naturalWidth / img.naturalHeight, cr = cols / rows;
    let sw, sh;
    if (ir > cr) { sh = img.naturalHeight; sw = sh * cr; } else { sw = img.naturalWidth; sh = sw / cr; }
    const sx = (img.naturalWidth - sw) * pos[0], sy = (img.naturalHeight - sh) * pos[1];
    g.drawImage(img, sx, sy, sw, sh, 0, 0, cols, rows);
    return g.getImageData(0, 0, cols, rows).data;
  };
  const noise = () => {
    // manchas suaves (ruído de valor) para a dissolução não parecer uma grade
    const gw = Math.ceil(cols / 7) + 2, gh = Math.ceil(rows / 7) + 2;
    const grid = Array.from({ length: gw * gh }, () => Math.random());
    const out = new Float32Array(cols * rows);
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const fx = x / 7, fy = y / 7, ix = Math.floor(fx), iy = Math.floor(fy);
      const tx = fx - ix, ty = fy - iy;
      const s = (tx * tx * (3 - 2 * tx)), t = (ty * ty * (3 - 2 * ty));
      const v = lerp(lerp(grid[iy * gw + ix], grid[iy * gw + ix + 1], s), lerp(grid[(iy + 1) * gw + ix], grid[(iy + 1) * gw + ix + 1], s), t);
      out[y * cols + x] = clamp(v * 0.85 + Math.random() * 0.15);
    }
    return out;
  };
  const setup = () => {
    const r = canvas.getBoundingClientRect();
    w = r.width; h = r.height;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cell = narrow() ? 9 : 8;
    cols = Math.ceil(w / cell); rows = Math.ceil(h / cell);
    const pImg = el.portraitImg, sImg = el.skyBg;
    if (!pImg.complete || !sImg.complete || !pImg.naturalWidth || !sImg.naturalWidth) return false;
    A = sample(pImg, [narrow() ? 0.76 : 0.7, 0.5]);
    B = sample(sImg);
    N = noise();
    return true;
  };
  let ready = false, last = -1;
  const draw = (t) => {
    if (!ready) ready = setup();
    if (!ready) return;
    if (Math.abs(t - last) < 0.002) return;
    last = t;
    ctx.clearRect(0, 0, w, h);
    if (t <= 0) return;
    const th = t * 1.45;
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const i = y * cols + x;
      const local = clamp((th - N[i]) / 0.45);
      if (local <= 0) continue;
      const k = i * 4;
      ctx.fillStyle = `rgb(${B[k]},${B[k + 1]},${B[k + 2]})`;
      ctx.fillRect(x * cell, y * cell, cell + 0.5, cell + 0.5);
      if (local < 1) {
        // o retrato vira pontos de meio-tom que encolhem até sumir
        ctx.fillStyle = `rgb(${A[k]},${A[k + 1]},${A[k + 2]})`;
        ctx.beginPath();
        ctx.arc(x * cell + cell / 2, y * cell + cell / 2, cell * 0.72 * (1 - local), 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };
  addEventListener('resize', () => { ready = false; last = -1; });
  return { draw, clear: () => { if (last !== 0) { ctx.clearRect(0, 0, w, h); last = 0; } } };
})();

/* ---------------- Linha do tempo do filme ---------------- */
let progress = 0;
ScrollTrigger.create({
  trigger: film, start: 'top top', end: 'bottom bottom', scrub: true,
  onUpdate: (s) => { progress = s.progress; },
});

function render(p, time) {
  const vw = innerWidth, vh = innerHeight;

  // Cena 1 — rendeira
  on('hero', p < 0.145);
  showCopy(copy.hero, p, -1, 0, 0.045, 0.085);
  el.figure.style.translate = `0 ${p * vh * 0.6}px`;
  el.drape.style.translate = `${-p * vw * 0.4}px 0`;

  // Pano varrendo a tela (0.07 → 0.21)
  const sw = ramp(p, 0.07, 0.21);
  el.sweep.style.transform = `translate(${lerp(1.1, -3.5, sw) * vw}px, -50%) rotate(${lerp(-8, 6, sw)}deg)`;
  el.cloth.style.opacity = ramp(p, 0.115, 0.135) * (1 - ramp(p, 0.15, 0.175));

  // Cena 2 — mergulho no cajueiro, depois a colheita
  on('tree', p >= 0.14 && p < 0.48);
  const z = ramp(p, 0.15, 0.37);
  el.tree.style.transformOrigin = '58% 46%';
  el.tree.style.transform = `scale(${lerp(1.04, 3.6, z)})`;
  const pk = ramp(p, 0.31, 0.37);
  el.pick.style.opacity = pk;
  el.pick.style.transform = `scale(${lerp(1.5, 1, ramp(p, 0.31, 0.45))})`;
  el.veil.style.opacity = 1 - ramp(p, 0.2, 0.28) * 0.25;
  showCopy(copy.tree, p, 0.17, 0.21, 0.39, 0.42);

  // Cena 3 — retrato entra da direita como uma página virando
  on('portrait', p >= 0.4 && p < 0.7);
  const rv = ramp(p, 0.41, 0.48);
  scenes.portrait.style.clipPath = `inset(0 0 0 ${(1 - rv) * 100}%)`;
  el.portraitImg.style.transform = `translateX(${(1 - rv) * 12}%)`;
  showCopy(copy.portrait, p, 0.47, 0.5, 0.555, 0.58);

  // Retícula: retrato → céu
  const dt = ramp(p, 0.585, 0.68);
  if (p > 0.56 && p < 0.72) dither.draw(dt); else dither.clear();

  // Cena 4 — céu e jangada
  on('sky', p >= 0.66 && p < 0.9);
  scenes.sky.style.opacity = ramp(p, 0.665, 0.69);
  const rf = ramp(p, 0.67, 0.8);
  const bob = reduced ? 0 : Math.sin(time * 1.3) * 10;
  const rx = narrow() ? lerp(-0.9, 0.07, rf) * vw : lerp(-0.6, 0.1, rf) * vw;
  const ry = narrow() ? vh * 0.52 : vh * 0.4;
  el.raft.style.transform = `translate(${rx}px, ${ry + bob}px) rotate(${(reduced ? 0 : Math.sin(time * 0.9) * 2) + (1 - rf) * -8}deg)`;
  el.skyBg.style.transform = `translate(${-p * 40}px, ${p * 30}px)`;
  showCopy(copy.sky, p, 0.71, 0.74, 0.81, 0.835);

  // Cena 5 — abóbada: abre como uma íris, depois a câmera sobe por ela
  on('vault', p >= 0.82);
  const iris = ramp(p, 0.83, 0.89);
  scenes.vault.style.clipPath = `circle(${iris * 120}% at 50% 50%)`;
  const dome = ramp(p, 0.84, 0.92), fly = ramp(p, 0.95, 1);
  const dx = narrow() ? 0 : -vw * 0.12;
  el.dome.style.transform = `translate(calc(-50% + ${dx * (1 - fly)}px), -50%) scale(${lerp(0.55, 1, dome) * lerp(1, 5, fly)}) rotate(${p * 40}deg)`;
  scenes.vault.style.opacity = 1 - ramp(p, 0.975, 1);
  showCopy(copy.vault, p, 0.88, 0.91, 0.945, 0.965);

  // Cor da barra conforme o fundo
  const ink = (p >= 0.14 && p < 0.585) || (p >= 0.86 && p < 0.975);
  el.bar.classList.toggle('is-ink', ink && !filmDone);
}

let filmDone = false;
ScrollTrigger.create({ trigger: '.idea', start: 'top 40px', end: 'max', onToggle: (s) => { el.bar.classList.toggle('is-ink', s.isActive); } });
ScrollTrigger.create({ trigger: '.stars', start: 'top 40px', end: 'bottom 40px', onToggle: (s) => { filmDone = s.isActive; if (s.isActive) el.bar.classList.remove('is-ink'); } });

let shown = -1;
gsap.ticker.add((time) => {
  const r = film.getBoundingClientRect();
  if (r.bottom < 0 || r.top > innerHeight) return;
  if (!reduced || shown !== progress) { render(progress, time); shown = progress; }
});

// Entrada única da primeira cena
if (!reduced) {
  gsap.from(el.figure, { yPercent: 18, opacity: 0, duration: 1.6, ease: 'expo.out', delay: 0.1 });
  gsap.from(el.drape, { xPercent: 25, opacity: 0, duration: 1.8, ease: 'expo.out' });
  gsap.from($$('.copy--hero > *'), { y: 30, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: 0.1, delay: 0.35 });
}

/* ---------------- Constelação ---------------- */
const QUESTIONS = [
  'Quem já paga para resolver isso hoje?',
  'Por que agora, e não há cinco anos?',
  'O que você sabe que os outros ainda não sabem?',
  'Qual é o menor teste que prova a ideia?',
  'Quem do seu lado largaria tudo por ela?',
  'Como ela chega no primeiro cliente sem anúncio?',
  'O que faria vocês desistirem?',
];
// As estrelas desenham um caju: o corpo da fruta e a castanha embaixo
const P = [[560, 70], [740, 140], [800, 300], [720, 450], [560, 470], [440, 560], [380, 470]];
const LINKS = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0], [4, 5], [5, 6], [6, 4]];
const NS = 'http://www.w3.org/2000/svg';
const sky = $('[data-sky]');
const qEl = $('[data-question]');
for (let i = 0; i < 46; i++) {
  const c = document.createElementNS(NS, 'circle');
  c.setAttribute('cx', String(Math.round(Math.random() * 1000)));
  c.setAttribute('cy', String(Math.round(Math.random() * 620)));
  c.setAttribute('r', (Math.random() * 1.6 + 0.6).toFixed(1));
  c.setAttribute('fill', `rgba(255,255,255,${(Math.random() * 0.5 + 0.2).toFixed(2)})`);
  sky.appendChild(c);
}
const lines = LINKS.map(([a, b]) => {
  const l = document.createElementNS(NS, 'line');
  l.setAttribute('x1', P[a][0]); l.setAttribute('y1', P[a][1]);
  l.setAttribute('x2', P[b][0]); l.setAttribute('y2', P[b][1]);
  l.setAttribute('class', 'link');
  const len = Math.hypot(P[b][0] - P[a][0], P[b][1] - P[a][1]);
  l.style.strokeDasharray = len; l.style.strokeDashoffset = reduced ? 0 : len;
  sky.appendChild(l);
  return l;
});
const starEls = P.map(([x, y], i) => {
  const g = document.createElementNS(NS, 'g');
  g.setAttribute('class', 'star');
  g.setAttribute('tabindex', '0');
  g.setAttribute('role', 'button');
  g.setAttribute('aria-label', `Pergunta ${i + 1}: ${QUESTIONS[i]}`);
  g.innerHTML = `<circle class="halo" cx="${x}" cy="${y}" r="14"/><circle class="core" cx="${x}" cy="${y}" r="5"/>`;
  const pick = () => {
    starEls.forEach((s) => s.classList.remove('on'));
    g.classList.add('on');
    qEl.textContent = QUESTIONS[i];
  };
  g.addEventListener('click', pick);
  g.addEventListener('mouseenter', pick);
  g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
  sky.appendChild(g);
  return g;
});
if (!reduced) {
  ScrollTrigger.create({
    trigger: '[data-stars]', start: 'top 55%', once: true,
    onEnter: () => {
      gsap.to(lines, { strokeDashoffset: 0, duration: 0.9, ease: 'power2.inOut', stagger: 0.12 });
      gsap.from(starEls, { scale: 0, transformOrigin: 'center', duration: 0.6, ease: 'back.out(3)', stagger: 0.1 });
      gsap.delayedCall(1.4, () => { if (!qEl.textContent) { starEls[0].classList.add('on'); qEl.textContent = QUESTIONS[0]; } });
    },
  });
} else { starEls[0].classList.add('on'); qEl.textContent = QUESTIONS[0]; }

/* ---------------- Formulário ---------------- */
const form = $('[data-form]');
const msg = $('[data-msg]');
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const nome = form.nome.value.trim(), email = form.email.value.trim(), ideia = form.ideia.value.trim();
  const okEmail = /^\S+@\S+\.\S+$/.test(email);
  form.nome.setAttribute('aria-invalid', String(!nome));
  form.email.setAttribute('aria-invalid', String(!okEmail));
  form.ideia.setAttribute('aria-invalid', String(!ideia));
  if (!nome || !okEmail || !ideia) {
    msg.className = 'idea__msg err';
    msg.textContent = !nome ? 'Escreva seu nome.' : !okEmail ? 'Confira o e-mail: falta o @ ou o domínio.' : 'Conte a ideia, nem que seja em uma frase.';
    return;
  }
  msg.className = 'idea__msg';
  msg.textContent = `Ideia enviada, ${nome.split(' ')[0]}. Respondemos em até uma semana. (Site de demonstração: nada foi enviado de verdade.)`;
  form.reset();
});

addEventListener('load', () => ScrollTrigger.refresh());
