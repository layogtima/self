"""Anchor each organ stack to a body, not to a guessed rectangle.

The female template carries its own body image, so its transform is exact:
map that body's height onto our 220x460 figure. The male file is a torso
illustration with no body image, but it draws the *same organ art* — so we fit
male->female from the shared organs and compose.
"""
import re, json

def imgs(path):
    doc = open(path, encoding='utf-8', errors='replace').read()
    out = []
    for t in re.findall(r'<image[^>]*?>', doc, re.S):
        g = lambda k: float((re.search(r'\b%s="([-\d.eE]+)"' % k, t) or ['', '0'])[1])
        out.append({'x': g('x'), 'y': g('y'), 'w': g('width'), 'h': g('height')})
    return out

F = imgs('references/Female_shadow_template.svg')
M = imgs('references/internal-organs.svg')

# --- the female body image is layer 0: its rect is the anchor ---
b = F[0]
FIG_H = 460.0
sf = FIG_H / b['h']
fx = 110.0 - (b['x'] + b['w'] / 2) * sf
fy = 0.0 - b['y'] * sf
print('female  scale %.6f  translate(%.3f, %.3f)' % (sf, fx, fy))

# --- male -> female, fitted on organs that appear in both files ---
# (female index, male index) for: stomach, liver, heart, lungs, gut, kidneys, brain
PAIRS = [(12, 12), (15, 15), (16, 16), (14, 14), (13, 13), (1, 9), (3, 2)]
sxs, sys = [], []
for fi, mi in PAIRS:
    sxs.append(F[fi]['w'] / M[mi]['w'])
    sys.append(F[fi]['h'] / M[mi]['h'])
sx = sum(sxs) / len(sxs)
sy = sum(sys) / len(sys)
txs = [F[fi]['x'] - sx * M[mi]['x'] for fi, mi in PAIRS]
tys = [F[fi]['y'] - sy * M[mi]['y'] for fi, mi in PAIRS]
tx = sum(txs) / len(txs)
ty = sum(tys) / len(tys)
print('male->female  sx %.4f sy %.4f  t(%.2f, %.2f)' % (sx, sy, tx, ty))
print('  x residuals', ['%.1f' % (F[fi]['x'] - (sx * M[mi]['x'] + tx)) for fi, mi in PAIRS])
print('  y residuals', ['%.1f' % (F[fi]['y'] - (sy * M[mi]['y'] + ty)) for fi, mi in PAIRS])

# compose male -> figure
msx, msy = sf * sx, sf * sy
mtx = sf * tx + fx
mty = sf * ty + fy
print('male    matrix(%.6f,0,0,%.6f,%.3f,%.3f)' % (msx, msy, mtx, mty))

groups = {
    'f': 'translate(%.3f,%.3f) scale(%.6f)' % (fx, fy, sf),
    'm': 'matrix(%.6f,0,0,%.6f,%.3f,%.3f)' % (msx, msy, mtx, mty),
}

# sanity: where do key organs land in the 220x460 box?
def show(sex, layers, mx, my, ox, oy):
    for name, d in layers:
        print('   %-8s x %6.1f..%-6.1f  y %6.1f..%-6.1f' % (
            name, d['x']*mx+ox, (d['x']+d['w'])*mx+ox, d['y']*my+oy, (d['y']+d['h'])*my+oy))
print('\nfemale lands:'); show('f', [('brain',F[3]),('lungs',F[14]),('liver',F[15]),('gut',F[13]),('pelvis',F[2])], sf, sf, fx, fy)
print('male lands:');   show('m', [('brain',M[2]),('lungs',M[14]),('liver',M[15]),('gut',M[13]),('kidney',M[9])], msx, msy, mtx, mty)

d = json.load(open('/tmp/anat_native.json'))
out = {}
for sex in ('m', 'f'):
    out[sex] = {'group': groups[sex], 'layers': d[sex]['layers']}
f = open('data/figures.js').read()
i = f.index('  anatomy: '); j = f.index('\n  icons:', i)
f = f[:i] + ("  /* Each stack is used as its source file draws it — native coords, each\n"
             "     layer's own transform, original z-order. The group transform is\n"
             "     anchored on a body, not guessed: the female template contains its own\n"
             "     body image, and the male torso file is fitted to it through the organ\n"
             "     art the two files share. Regenerate with tools/extract-anatomy.py. */\n"
             "  anatomy: ") + json.dumps(out, indent=1) + ',' + f[j:]
open('data/figures.js','w').write(f)
print('\ninstalled')
