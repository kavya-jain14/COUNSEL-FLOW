import pdfplumber, re, json, os, glob

CAT = {'OPEN':'GEN','EWS':'EWS','OBC-NCL':'OBC','SC':'SC','ST':'ST'}
WANT = ['Institute','Academic Program Name','Quota','Seat Type','Gender','Closing Rank']

def josaa_meta(name):
    y = re.search(r'(20\d\d)', name)
    r = re.search(r'Round-(\d+)', name)
    return (int(y.group(1)) if y else None), (int(r.group(1)) if r else None)

def clean(c):
    return (c or '').replace('\n', ' ').strip()

def parse_josaa(path):
    year, rnd = josaa_meta(os.path.basename(path))
    out, idx = [], None
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            for tb in page.extract_tables():
                for row in tb:
                    if not row:
                        continue
                    cells = [clean(c) for c in row]
                    if 'Institute' in cells and 'Closing Rank' in cells:
                        idx = {w: cells.index(w) for w in WANT if w in cells}
                        continue
                    if not idx or len(idx) < 6 or max(idx.values()) >= len(cells):
                        continue
                    seat = cells[idx['Seat Type']]
                    base = seat.replace(' (PwD)', '').strip()
                    if base not in CAT:
                        continue
                    digits = re.sub(r'\D', '', cells[idx['Closing Rank']])
                    if not digits:
                        continue
                    out.append({
                        'authority': 'JOSAA', 'year': year, 'round': rnd,
                        'institute': cells[idx['Institute']],
                        'program': cells[idx['Academic Program Name']],
                        'category': CAT[base],
                        'quota': cells[idx['Quota']],
                        'pwd': '(PwD)' in seat,
                        'gender': 'FO' if 'Female' in cells[idx['Gender']] else 'GN',
                        'closingRank': int(digits),
                    })
    return out

CATMAP = {'OP':'GEN','BC':'OBC','SC':'SC','ST':'ST','EW':'EWS'}

def parse_ipu(path):
    out, hdr = [], None
    year = 2026 if '2026' in os.path.basename(path) else 2024
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            for tb in page.extract_tables():
                for row in tb:
                    if not row:
                        continue
                    if row[0] and str(row[0]).strip() == 'Sl.No.':
                        hdr = [clean(c) for c in row]
                        continue
                    if not hdr or not row[0] or not str(row[0]).strip().isdigit():
                        continue
                    inst, prog = clean(row[1]), clean(row[2])
                    if not inst or not prog:
                        continue
                    for i in range(3, min(len(row), len(hdr))):
                        code = hdr[i]
                        if not code or len(code) < 6:
                            continue
                        m = re.search(r'Max\s*Rank\s*-\s*(\d+)', clean(row[i]))
                        if not m or code[:2] not in CATMAP:
                            continue
                        out.append({
                            'authority': 'IPU', 'year': year, 'round': 3,
                            'institute': inst, 'program': prog,
                            'category': CATMAP[code[:2]],
                            'quota': code[4:6],
                            'pwd': code[2:4] == 'PH',
                            'gender': 'GN',
                            'closingRank': int(m.group(1)),
                        })
    return out

rows = []
for f in sorted(glob.glob('src/assets/josaa data/*.pdf')):
    r = parse_josaa(f); rows += r
    print('%-46s %6d rows' % (os.path.basename(f)[:44], len(r)), flush=True)
for f in sorted(glob.glob('src/assets/ipu data/*.pdf')):
    r = parse_ipu(f); rows += r
    print('%-46s %6d rows' % (os.path.basename(f)[:44], len(r)), flush=True)

json.dump(rows, open('scripts/raw-cutoffs.json', 'w', encoding='utf8'))
print('TOTAL', len(rows))
