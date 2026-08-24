"""Lift each source file's organ stack out *as it is*.

Every layer keeps its own x/y/w/h and its own transform (several organs are
drawn rotated), and the document order is kept, because that order is the
z-order the anatomist intended. The only thing we add is one group transform
that drops the whole stack into our silhouette's torso.
"""
import re, base64, io, json, math, os
from PIL import Image

SRC = {
    'm': ('references/internal-organs.svg',
          # brain, lymph, trachea, larynx, thyroid, kidneys, spleen, pancreas,
          # stomach, intestines, lungs+heart, liver, heart, gallbladder
          [2, 3, 5, 6, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17]),
    'f': ('references/Female_shadow_template.svg',
          [3, 7, 8, 1, 9, 11, 12, 13, 14, 15, 16, 17, 20, 2]),
}

# what each layer is, per file, so status can light the right one
NAME = {
    'm': {2:'brain',3:'lymph',5:'trachea',6:'larynx',8:'thyroid',9:'kidneys',
          10:'spleen',11:'pancreas',12:'stomach',13:'gut',14:'lungs',15:'liver',
          16:'heart',17:'gallbladder'},
    'f': {3:'brain',7:'trachea',8:'larynx',1:'kidneys',9:'spleen',11:'pancreas',
          12:'stomach',13:'gut',14:'lungs',15:'liver',16:'heart',17:'gallbladder',
          20:'thyroid',2:'pelvis'},
}
REGION = {'brain':'brain','lymph':'blood','trachea':'heart','larynx':'thyroid',
          'thyroid':'thyroid','kidneys':'kidneys','spleen':'blood','pancreas':'pancreas',
          'stomach':'pancreas','gut':'pancreas','lungs':'heart','liver':'liver',
          'heart':'heart','gallbladder':'liver','pelvis':'bones'}

def num(t, k):
    m = re.search(r'\b%s="([-\d.eE]+)"' % k, t)
    return float(m.group(1)) if m else 0.0

def parse_tf(s):
    """Return a 2x3 matrix [a,b,c,d,e,f] for the transform string."""
    M = [1, 0, 0, 1, 0, 0]
    def mul(A, B):
        return [A[0]*B[0]+A[2]*B[1], A[1]*B[0]+A[3]*B[1],
                A[0]*B[2]+A[2]*B[3], A[1]*B[2]+A[3]*B[3],
                A[0]*B[4]+A[2]*B[5]+A[4], A[1]*B[4]+A[3]*B[5]+A[5]]
    if not s:
        return M
    for name, args in re.findall(r'(\w+)\s*\(([^)]*)\)', s):
        v = [float(x) for x in re.findall(r'-?[\d.]+(?:e-?\d+)?', args)]
        if name == 'matrix':
            M = mul(M, v)
        elif name == 'translate':
            M = mul(M, [1, 0, 0, 1, v[0], v[1] if len(v) > 1 else 0])
        elif name == 'scale':
            M = mul(M, [v[0], 0, 0, v[1] if len(v) > 1 else v[0], 0, 0])
        elif name == 'rotate':
            a = math.radians(v[0]); c, s_ = math.cos(a), math.sin(a)
            if len(v) == 3:
                M = mul(M, [1, 0, 0, 1, v[1], v[2]])
                M = mul(M, [c, s_, -s_, c, 0, 0])
                M = mul(M, [1, 0, 0, 1, -v[1], -v[2]])
            else:
                M = mul(M, [c, s_, -s_, c, 0, 0])
    return M

def apply(M, x, y):
    return (M[0]*x + M[2]*y + M[4], M[1]*x + M[3]*y + M[5])

out = {}
os.makedirs('assets/anatomy', exist_ok=True)
for sex, (path, picks) in SRC.items():
    doc = open(path, encoding='utf-8', errors='replace').read()
    tags = re.findall(r'<image[^>]*?>', doc, re.S)
    layers = []
    for idx in picks:
        t = tags[idx]
        x, y, w, h = num(t, 'x'), num(t, 'y'), num(t, 'width'), num(t, 'height')
        tfs = re.search(r'transform="([^"]+)"', t)
        tf = tfs.group(1) if tfs else ''
        M = parse_tf(tf)
        corners = [apply(M, x, y), apply(M, x+w, y), apply(M, x, y+h), apply(M, x+w, y+h)]
        key = NAME[sex][idx]
        png = base64.b64decode(re.sub(r'\s', '', re.search(r'base64,([A-Za-z0-9+/=\s]+)', t).group(1)))
        im = Image.open(io.BytesIO(png)).convert('RGBA')
        im.thumbnail((460, 460), Image.LANCZOS)
        fn = 'assets/anatomy/%s-%s.webp' % (sex, key)
        im.save(fn, quality=84, method=6)
        layers.append({'k': key, 'src': fn, 'x': round(x,1), 'y': round(y,1),
                       'w': round(w,1), 'h': round(h,1), 'tf': tf,
                       'region': REGION[key],
                       '_bb': [min(c[0] for c in corners), min(c[1] for c in corners),
                               max(c[0] for c in corners), max(c[1] for c in corners)]})
    bb = [min(l['_bb'][0] for l in layers), min(l['_bb'][1] for l in layers),
          max(l['_bb'][2] for l in layers), max(l['_bb'][3] for l in layers)]
    for l in layers:
        del l['_bb']
    out[sex] = {'layers': layers, 'bbox': [round(v,1) for v in bb]}
    print('%s: %d layers  bbox %s' % (sex, len(layers), out[sex]['bbox']))

json.dump(out, open('/tmp/anat_native.json','w'), indent=1)
