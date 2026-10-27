// Cortina em WebGL: a pintura vira um tecido que ondula. As dobras correm na vertical,
// então a onda desloca a imagem na horizontal, mais na barra (embaixo) que no varão (em cima),
// e a luz acompanha a inclinação da dobra.
const VS = `attribute vec2 p; varying vec2 uv; void main(){ uv = p * .5 + .5; uv.y = 1. - uv.y; gl_Position = vec4(p, 0., 1.); }`;
const FS = `precision mediump float;
varying vec2 uv; uniform sampler2D img; uniform float t, sopro, borda;
float onda(float y, float x){
  float solto = smoothstep(.05, 1., y);                 // preso no varão, solto na barra
  return solto * (sin(y * 9. + t * 1.7 + x * 6.) * .010 + sin(y * 17. - t * 2.3) * .004)
       + solto * sopro * sin(y * 6. - t * 5.5 + x * 3.) * .045 * (1. - x);  // empurrão de quem passou
}
void main(){
  float d = onda(uv.y, uv.x);
  vec2 q = vec2(uv.x + d, uv.y);
  vec4 c = texture2D(img, q);
  float inc = (onda(uv.y + .01, uv.x) - d) * 60.;           // inclinação da dobra
  c.rgb *= 1. + inc * .9;
  // borda esquerda que acompanha a onda: recorta o que sai da imagem
  c *= smoothstep(0., .004, q.x) * step(q.x, 1.);
  gl_FragColor = c;
}`;

export function criarCortina(img, canvas) {
  const gl = canvas.getContext('webgl', { premultipliedAlpha: false, alpha: true });
  if (!gl) return cortina2d(img, canvas);
  const sh = (tipo, src) => { const s = gl.createShader(tipo); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const pr = gl.createProgram();
  gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(pr); gl.useProgram(pr);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(pr, 'p');
  gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  const u = { t: gl.getUniformLocation(pr, 't'), sopro: gl.getUniformLocation(pr, 'sopro') };
  let pronta = false;
  const subir = () => { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img); pronta = true; };
  img.complete && img.naturalWidth ? subir() : img.addEventListener('load', subir, { once: true });

  function tamanho() {
    const r = canvas.getBoundingClientRect(), dpr = Math.min(devicePixelRatio, 2);
    const w = Math.round(r.width * dpr), h = Math.round(r.height * dpr);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); }
  }
  return {
    desenhar(t, sopro) {
      if (!pronta) return;
      tamanho();
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(u.t, t); gl.uniform1f(u.sopro, sopro);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
  };
}

// Sem WebGL (alguns navegadores e celulares): a mesma onda feita em faixas horizontais no canvas 2D
function cortina2d(img, canvas) {
  const ctx = canvas.getContext('2d');
  const onda = (y, x, t, sopro) => {
    const solto = Math.min(1, Math.max(0, (y - 0.05) / 0.95)); const sm = solto * solto * (3 - 2 * solto);
    return sm * (Math.sin(y * 9 + t * 1.7 + x * 6) * 0.010 + Math.sin(y * 17 - t * 2.3) * 0.004)
      + sm * sopro * Math.sin(y * 6 - t * 5.5 + x * 3) * 0.045;
  };
  return {
    desenhar(t, sopro) {
      if (!img.naturalWidth) return;
      const r = canvas.getBoundingClientRect(), dpr = Math.min(devicePixelRatio, 2);
      const w = Math.round(r.width * dpr), h = Math.round(r.height * dpr);
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      ctx.clearRect(0, 0, w, h);
      const faixa = Math.max(2, Math.round(3 * dpr)), sy = img.naturalHeight / h;
      for (let y = 0; y < h; y += faixa) {
        const v = y / h, d = onda(v, 0.3, t, sopro) * w;
        ctx.drawImage(img, 0, y * sy, img.naturalWidth, faixa * sy, -d, y, w, faixa);
      }
    },
  };
}
