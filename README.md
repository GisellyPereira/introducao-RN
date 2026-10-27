# Pera — a agência que vira sócia

Landing page fictícia que reproduz, em português, o site de referência (reel da w.wearebrand): um filme guiado pelo scroll, com pinturas neoclássicas, interface de grade fina sobre azul royal e transições em retícula.

**Site no ar:** https://pera-agencia.netlify.app

## As cenas, na ordem do reel

1. O jovem grego de túnica e faixa vermelha sai de trás da cortina pontilhada e pisa no degrau de mármore. "A Pera faz você aparecer."
2. A cortina fecha por cima dele, toma a tela com zoom na trama, e uma faixa bege atravessa na diagonal.
3. Mãos fazendo o enxerto de um galho de pereira.
4. A pereira: "Construímos." Uma mão sobe e colhe a pera dourada: "Posicionamos."
5. O retrato com a pera: "Dividimos o que ele rende." A pera aparece partida ao meio e as metades se abrem para o azul.
6. Céu com nuvens em retícula, régua de marcações e o texto em coluna. Uma pera pontilhada sobe e cresce.
7. A pera gigante dourada no andaime e, depois, a mulher lendo a planta. A câmera entra na planta.
8. A gravura do canteiro aparece em perspectiva e deita até ficar vista de cima: "Sem taxa. Uma parte do que crescer."
9. Uma onda de pontos azuis sobe e cobre a tela.
10. A mulher podando a pereira, com peras pontilhadas caindo: "Dizemos não mais do que sim."
11. Galhos de pereira emolduram "Perguntas antes de *assinar*", com as perguntas ligadas por linhas tracejadas.
12. Constelação: o jovem de manto vermelho aponta para as estrelas, ao lado do formulário em cartões de vidro.

## Técnica

- Vite, GSAP (ScrollTrigger) e Lenis.
- Pinturas geradas com IA (Figma), recortadas do fundo verde por `scripts/cutout.py`.
- Retícula: `scripts/halftone.py` gera a cortina, as nuvens e a pera pontilhadas; a onda azul é desenhada em canvas.
- Funciona no celular e respeita `prefers-reduced-motion`.

```bash
npm install
npm run dev
```

Pera, textos e números são fictícios.
