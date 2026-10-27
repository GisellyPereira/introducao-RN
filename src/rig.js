// Esqueleto do jovem: cada parte é um <g data-j> do SVG e gira em torno da sua junta.
// As coordenadas são as da imagem-mãe (848 x 1264), onde as partes foram recortadas.
const JUNTAS = {
  'perna-frente': [492, 850], // joelho (escondido sob a túnica)
  'perna-tras': [398, 850],
  braco: [478, 422], // ombro
  'braco-tras': [470, 426],
  saia: [440, 545], // cintura
  tronco: [440, 545],
};

// Ponta e calcanhar de cada pé, relativos ao joelho: servem para manter a sola no chão
const SOLA = { 'perna-frente': [-122, 23, 358], 'perna-tras': [-108, 27, 310] };
const rad = (d) => (d * Math.PI) / 180;
// quanto a sola desce (positivo) quando a perna gira a graus em torno do joelho
function quedaDaSola(nome, a) {
  const [ponta, calc, dy] = SOLA[nome];
  const y = (dx) => dx * Math.sin(rad(a)) + dy * Math.cos(rad(a));
  return Math.max(y(ponta), y(calc)) - dy;
}

export function criarJovem(svg) {
  const j = {};
  svg.querySelectorAll('[data-j]').forEach((g) => (j[g.dataset.j] = g));
  const rot = (nome, a, dx = 0, dy = 0) => {
    const [x, y] = JUNTAS[nome];
    j[nome].setAttribute('transform', `translate(${dx.toFixed(2)} ${dy.toFixed(2)}) rotate(${a.toFixed(2)} ${x} ${y})`);
  };

  // fase: 0..1 por ciclo (dois passos); amp: 0 parado (pose da pintura) a 1 andando
  function pose(fase, amp = 1) {
    const w = fase * Math.PI * 2;
    const s = Math.sin(w), c = Math.cos(w);
    // perna que avança sobe um pouco; a de apoio fica no chão
    const liftF = Math.max(0, c) ** 1.6 * 16 * amp;
    const liftT = Math.max(0, -c) ** 1.6 * 16 * amp;
    const aF = 17 * s * amp, aT = -17 * s * amp;
    const a = rad(17 * Math.abs(s) * amp);
    const bob = 340 * (1 - Math.cos(a)); // o corpo desce no apoio duplo
    // cada perna compensa a descida do corpo e a da própria sola: o pé de apoio fica plantado
    rot('perna-frente', aF, 0, -bob - quedaDaSola('perna-frente', aF) - liftF);
    rot('perna-tras', aT, 0, -bob - quedaDaSola('perna-tras', aT) - liftT);
    rot('braco', -11 * s * amp + 1.5 * amp);
    rot('braco-tras', 11 * s * amp + 1.5 * amp, -6, 2);
    // túnica: a barra acompanha as pernas com atraso e balanço
    const sk = Math.sin(w - 0.6) * 2.6 * amp;
    j.saia.setAttribute('transform', `translate(440 545) skewX(${sk.toFixed(2)}) translate(-440 -545)`);
    rot('tronco', 0.8 * s * amp);
    j.corpo.setAttribute('transform', `translate(0 ${bob.toFixed(2)})`);
    j.sombra.setAttribute('rx', (170 + Math.abs(s) * 26 * amp).toFixed(1));
  }
  pose(0, 0);
  return { pose };
}
