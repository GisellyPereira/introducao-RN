# Maturi — estúdio fictício que constrói empresas

Landing page que funciona como **um filme guiado pelo scroll**, com pinturas clássicas de temas cearenses: a rendeira, o cajueiro, a jangada.

**Site no ar:** https://maturi-estudio.netlify.app

## O filme

A primeira parte é um palco fixo. O scroll é a linha do tempo:

1. **Rendeira no pedestal:** "Coragem faz você aparecer."
2. **O pano varre a tela** e revela o cajueiro.
3. **Mergulho no cajueiro:** a câmera se aproxima de um caju até virar a cena das mãos colhendo a fruta. "A gente constrói."
4. **O retrato entra como uma página virando:** "E divide o que ela render."
5. **Dissolução em retícula:** o retrato se desfaz em pontos de meio-tom e vira céu (canvas, com ruído para formar manchas).
6. **Jangada com um caju gigante** atravessando o céu: "Sem mensalidade. Sem taxa de projeto."
7. **A abóbada** se abre como uma íris e a câmera sobe por ela: "Feito pra durar."

Depois vem a **constelação**: sete estrelas desenham um caju e cada uma é uma pergunta que o estúdio faz antes de começar. O filósofo aponta para elas. Por último, o formulário para mandar a ideia.

## Detalhes técnicos

- Vite, GSAP (ScrollTrigger) e Lenis.
- Pinturas geradas com IA (Figma) e recortadas do fundo verde por `scripts/cutout.py`.
- Funciona no celular, tem foco visível no teclado e respeita `prefers-reduced-motion`.

## Rodar localmente

```bash
npm install
npm run dev
```

Maturi, endereço e textos são fictícios.
