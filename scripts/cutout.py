"""Recorta figuras pintadas sobre fundo verde (chroma key) e salva WebP com transparência.
Uso: python3 cutout.py ORIGEM.png DESTINO.webp [largura_max]"""
import sys, numpy as np
from PIL import Image
from scipy import ndimage

src, dst = sys.argv[1], sys.argv[2]
maxw = int(sys.argv[3]) if len(sys.argv) > 3 else None
a = np.asarray(Image.open(src).convert('RGB')).astype(np.float32)
r, g, b = a[..., 0], a[..., 1], a[..., 2]
green = g - np.maximum(r, b)
alpha = 1 - np.clip((green - 30) / 50, 0, 1)
# remove ilhas de verde presas (ex.: entre braço e corpo) e pontinhos soltos
solid = alpha > 0.5
lab, n = ndimage.label(solid)
if n:
    sizes = ndimage.sum(solid, lab, range(1, n + 1))
    keep = np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s > sizes.max() * 0.01])
    alpha = np.where(ndimage.binary_dilation(keep, iterations=3), alpha, 0)
alpha = ndimage.gaussian_filter(alpha, 0.7)
rgb = a.copy()
rgb[..., 1] = np.minimum(g, np.maximum(r, b) + 4)  # tira o reflexo verde
img = Image.fromarray(np.dstack([rgb, alpha * 255]).clip(0, 255).astype(np.uint8), 'RGBA')
img = img.crop(img.getbbox())
if maxw and img.width > maxw:
    img = img.resize((maxw, round(img.height * maxw / img.width)), Image.LANCZOS)
img.save(dst, 'WEBP', quality=86, method=6)
print(dst, img.size)
