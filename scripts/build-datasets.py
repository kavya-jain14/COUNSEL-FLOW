import json, re, os, collections

rows = json.load(open('scripts/raw-cutoffs.json', encoding='utf8'))
print('raw rows:', len(rows))

BRANCH = [
    (r'computer science and engineering \(dual', 'CSE'),
    (r'computer science', 'CSE'),
    (r'information technology', 'IT'),
    (r'electronics and communication', 'ECE'),
    (r'electrical engineering', 'EE'),
    (r'electrical and electronics', 'EE'),
    (r'mechanical engineering', 'ME'),
    (r'civil engineering', 'CE'),
    (r'artificial intelligence', 'AIML'),
    (r'chemical engineering', 'CHEM'),
]

def branch_of(prog):
    p = prog.lower()
    for pat, code in BRANCH:
        if re.search(pat, p):
            return code
    return None

def short(inst):
    s = re.sub(r'\s+', ' ', inst).strip()
    s = s.replace('Indian Institute of Technology', 'IIT')
    s = s.replace('National Institute of Technology', 'NIT')
    s = s.replace('Indian Institute of Information Technology', 'IIIT')
    s = re.sub(r',?\s*(Delhi-\d+|New Delhi-\d+)', '', s)
    s = re.sub(r'\s*\(.*?\)\s*', ' ', s)
    return re.sub(r'\s+', ' ', s).strip()[:60]

def slug(x):
    return re.sub(r'[^a-z0-9]+', '-', x.lower()).strip('-')

kept = [r for r in rows if branch_of(r['program']) and not r['pwd'] and r['gender'] == 'GN']
print('after branch/GN/non-PwD filter:', len(kept))

for r in kept:
    r['branch'] = branch_of(r['program'])
    r['optionId'] = f"{r['authority'].lower()}-{slug(short(r['institute']))}-{r['branch'].lower()}"

by_auth = collections.Counter(r['authority'] for r in kept)
print('per authority:', dict(by_auth))
print('distinct options:', len({r['optionId'] for r in kept}))
print('years:', sorted({(r['authority'], r['year'], r['round']) for r in kept}))

json.dump(kept, open('scripts/filtered-cutoffs.json', 'w', encoding='utf8'))
