"""Gera versões em retícula (meio-tom), no estilo pontilhado do site de referência.
modo 'tela': base escura opaca + pontos claros com raio proporcional à luz (cortina)
modo 'pontos': fundo transparente + pontos da cor da imagem com raio proporcional à opacidade e à luz (nuvens, pera)"""
import sys, numpy as np
from PIL import Image, ImageDraw

def halftone(img, step, mode, k=3, gain=1.0):
    img = img.convert('RGBA')
    a = np.asarray(img).astype(np.float32) / 255
    H, W = a.shape[:2]
    out = Image.new('RGBA', (W * k, H * k), (0, 0, 0, 0))
    d = ImageDraw.Draw(out)
    for y in range(0, H, step):
        for x in range(0, W, step):
            c = a[y:y + step, x:x + step]
            al = c[..., 3].mean()
            if al < 0.04:
                continue
            rgb = (c[..., :3] * c[..., 3:4]).sum((0, 1)) / max(c[..., 3].sum(), 1e-6)
            lum = (0.3 * rgb[0] + 0.59 * rgb[1] + 0.11 * rgb[2])
            cx, cy = (x + step / 2) * k, (y + step / 2) * k
            if mode == 'tela':
                dark = tuple(int(v * 255 * 0.32) for v in rgb) + (int(al * 255),)
                d.rectangle([x * k, y * k, (x + step) * k, (y + step) * k], fill=dark)
                r = step * k * 0.5 * min(1.15, (lum ** 0.9) * 1.25 * gain)
                light = tuple(int(min(255, v * 255 * 1.18 + 20)) for v in rgb) + (int(al * 255),)
            else:
                r = step * k * 0.5 * min(1.1, (al ** 0.8) * (0.35 + 0.8 * lum) * gain)
                light = tuple(int(min(255, v * 255 * 1.05)) for v in rgb) + (255,)
            if r > 0.4:
                d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=light)
    return out.resize((W, H), Image.LANCZOS)

if __name__ == '__main__':
    src, dst, step, mode = sys.argv[1], sys.argv[2], int(sys.argv[3]), sys.argv[4]
    maxw = int(sys.argv[5]) if len(sys.argv) > 5 else None
    im = Image.open(src)
    if maxw and im.width > maxw:
        im = im.resize((maxw, round(im.height * maxw / im.width)), Image.LANCZOS)
    out = halftone(im, step, mode)
    out.save(dst, 'WEBP', quality=88, method=6) if dst.endswith('.webp') else out.save(dst)
    print(dst, out.size)
