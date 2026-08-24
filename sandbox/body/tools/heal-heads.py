"""Heal the crown notch by working on our own silhouette, not the source.

The source sheet has label leader lines crossing the arms and legs; any
morphology strong enough to close the notch at the crown also lets those lines
cut the limbs. Our traced path has no such lines, so rasterise it, close the
head band only, and re-trace. The back view is the front mirrored — for a
silhouette that is what a body actually looks like from behind.
"""
import re, json, subprocess, sys
import numpy as np
from PIL import Image, ImageFilter
from collections import deque
sys.setrecursionlimit(40000)

W, H = 220, 460
SS = 4                       # supersample so the re-trace keeps its edges

f = open('data/figures.js').read()
# scope to the figures block: the anatomy block above it also has "m"/"f" keys
fig = f[f.index('  figures: {'):]
paths = {}
for sex in ('m', 'f'):
    blk = re.search(r'"%s": \{.*?"bodies": \{(.*?)\n   \}' % sex, fig, re.S).group(1)
    paths[sex] = re.search(r'"front": "([^"]+)"', blk).group(1)
print('extracted lengths:', {k: len(v) for k, v in paths.items()})

def raster(d):
    svg = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" width="%d" height="%d">'
           '<rect width="%d" height="%d" fill="#fff"/><path d="%s" fill="#000"/></svg>'
           % (W, H, W*SS, H*SS, W, H, d))
    open('/tmp/_r.svg', 'w').write(svg)
    subprocess.run(['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
                    '--headless=new', '--disable-gpu', '--window-size=%d,%d' % (W*SS, H*SS),
                    '--virtual-time-budget=4000', '--screenshot=/tmp/_r.png',
                    'file:///tmp/_r.svg'], capture_output=True)
    return np.array(Image.open('/tmp/_r.png').convert('L')) < 128

def morph(m, k, op):
    im = Image.fromarray((m * 255).astype('uint8'))
    im = (im.filter(ImageFilter.MaxFilter(k)).filter(ImageFilter.MinFilter(k)) if op == 'close'
          else im.filter(ImageFilter.MinFilter(k)).filter(ImageFilter.MaxFilter(k)))
    return np.array(im) > 127

def fill(m):
    Hh, Ww = m.shape
    out = np.zeros_like(m); q = deque()
    for x in range(Ww):
        for y in (0, Hh-1):
            if not m[y, x] and not out[y, x]: out[y, x] = True; q.append((y, x))
    for y in range(Hh):
        for x in (0, Ww-1):
            if not m[y, x] and not out[y, x]: out[y, x] = True; q.append((y, x))
    while q:
        y, x = q.popleft()
        for dy, dx in ((1,0),(-1,0),(0,1),(0,-1)):
            ny, nx = y+dy, x+dx
            if 0 <= ny < Hh and 0 <= nx < Ww and not m[ny, nx] and not out[ny, nx]:
                out[ny, nx] = True; q.append((ny, nx))
    return ~out

def trace(m):
    pad = np.zeros((m.shape[0]+2, m.shape[1]+2), bool); pad[1:-1, 1:-1] = m; m = pad
    start = None
    for y in range(m.shape[0]):
        xs = np.where(m[y])[0]
        if len(xs): start = (y, xs[0]); break
    N8 = [(-1,0),(-1,1),(0,1),(1,1),(1,0),(1,-1),(0,-1),(-1,-1)]
    c = [start]; cur = start; bd = 6; guard = 0
    while True:
        guard += 1
        if guard > 2000000: break
        found = False
        for k in range(8):
            d = (bd + 1 + k) % 8
            ny, nx = cur[0]+N8[d][0], cur[1]+N8[d][1]
            if 0 <= ny < m.shape[0] and 0 <= nx < m.shape[1] and m[ny, nx]:
                bd = (d + 4) % 8; cur = (ny, nx); c.append(cur); found = True; break
        if not found: break
        if cur == start and len(c) > 4: break
    return c

def dp(pts, eps):
    if len(pts) < 3: return pts
    A = np.array(pts[0], float); B = np.array(pts[-1], float)
    ab = B - A; L = np.hypot(*ab)
    d = ([abs(np.cross(ab, np.array(p, float) - A)) / L for p in pts] if L
         else [np.hypot(*(np.array(p, float) - A)) for p in pts])
    i = int(np.argmax(d))
    if d[i] > eps: return dp(pts[:i+1], eps)[:-1] + dp(pts[i:], eps)
    return [pts[0], pts[-1]]

out = {}
for sex, d in paths.items():
    m = raster(d)
    head_rows = int(0.16 * m.shape[0])            # skull and hair only
    head = morph(m[:head_rows], 4*SS+1, 'close')  # close the notch at the crown
    m2 = np.vstack([head, m[head_rows:]])
    m2 = fill(m2)
    cont = trace(m2)
    simple = dp(cont, 1.1 * SS)
    pts = [((x-1)/SS, (y-1)/SS) for (y, x) in simple]
    xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
    mnx, mny, mxx, mxy = min(xs), min(ys), max(xs), max(ys)
    s = min(W/(mxx-mnx), H/(mxy-mny)); ox = (W-(mxx-mnx)*s)/2
    P = [((p[0]-mnx)*s+ox, (p[1]-mny)*s) for p in pts]
    dd = ['M %.1f %.1f' % ((P[0][0]+P[1][0])/2, (P[0][1]+P[1][1])/2)]
    for i in range(1, len(P)):
        c0 = P[i]; n = P[(i+1) % len(P)]
        dd.append('Q %.1f %.1f %.1f %.1f' % (c0[0], c0[1], (c0[0]+n[0])/2, (c0[1]+n[1])/2))
    dd.append('Z')
    out[sex] = ' '.join(dd)
    print('%s: contour %d -> %d pts' % (sex, len(cont), len(simple)))

json.dump(out, open('/tmp/heads_fixed.json', 'w'))
svg = '<svg xmlns="http://www.w3.org/2000/svg" width="960" height="500" style="background:#efe9dc">'
for i, sex in enumerate(('m', 'f')):
    svg += '<g transform="translate(%d,15) scale(0.95)"><path d="%s" fill="#3e4a41"/></g>' % (i*240+15, out[sex])
    # mirrored = the back view
    svg += ('<g transform="translate(%d,15) scale(0.95)"><g transform="translate(220,0) scale(-1,1)">'
            '<path d="%s" fill="#3e4a41"/></g></g>' % ((i*2+1)*240+15, out[sex]))
svg += '</svg>'
open('_bodies.svg', 'w').write(svg)
print('preview written')
