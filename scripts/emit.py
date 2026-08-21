import json, re, collections, os

rows = json.load(open('scripts/filtered-cutoffs.json', encoding='utf8'))

CITY_KNOWN = set("""Agra Aligarh Banda Bareilly Ghaziabad Gorakhpur Jhansi Kanpur Lucknow
Meerut Moradabad Noida Prayagraj Varanasi Delhi""".split())

def city_of(inst, authority):
    if authority == 'IPU':
        return 'Delhi'
    tail = re.sub(r'[^A-Za-z ]', ' ', inst).split()
    for w in reversed(tail):
        if w in CITY_KNOWN:
            return w
    return tail[-1] if tail else 'Unknown'

def itype(inst, authority):
    if authority == 'JOSAA':
        return 'GOVERNMENT'
    return 'GOVERNMENT' if 'University School' in inst else 'PRIVATE'

def short(inst):
    s = re.sub(r'\s+', ' ', inst).strip()
    s = s.replace('Indian Institute of Technology', 'IIT')
    s = s.replace('National Institute of Technology', 'NIT')
    s = s.replace('Indian Institute of Information Technology', 'IIIT')
    s = re.sub(r',?\s*(New )?Delhi-\d+', '', s)
    s = re.sub(r'\s*\(.*?\)\s*', ' ', s)
    return re.sub(r'\s+', ' ', s).strip()[:52]

SRC = {
    ('JOSAA', 2025, 6): 'JoSAA 2025 Round 6 official closing ranks',
    ('JOSAA', 2024, 5): 'JoSAA 2024 Round 5 official opening/closing ranks',
    ('IPU',   2026, 3): 'GGSIPU 2026-27 Round 3 official cutoff',
}

options, cutoffs = {}, []
for r in rows:
    oid = r['optionId']
    key = (r['authority'], r['year'], r['round'])
    if oid not in options:
        city = city_of(r['institute'], r['authority'])
        options[oid] = {
            'id': oid,
            'college': re.sub(r'\s+', ' ', r['institute']).strip()[:200],
            'collegeShort': short(r['institute']),
            'branch': r['branch'],
            'instituteType': itype(r['institute'], r['authority']),
            'city': city,
            'annualFee': None,
            'distanceKm': None,
            'hostelAvailable': None,
            'placementScore': None,
            'campusScore': None,
            'closingRank': None,
            'sourceLabel': SRC.get(key, r['authority']),
            'sourceYear': r['year'],
            'missingFacts': ['annualFee', 'hostelAvailable', 'placementScore', 'campusScore'],
            'authority': r['authority'],
        }
    cutoffs.append({
        'a': r['authority'], 'y': r['year'], 'r': r['round'],
        'o': oid,
        'p': '%s:%s:%s' % (r['authority'], r['category'], r['quota']),
        'c': r['closingRank'],
    })

# keep the best (lowest) closing rank per (option, pool, year, round) — the true closing rank
best = {}
for c in cutoffs:
    k = (c['a'], c['y'], c['r'], c['o'], c['p'])
    if k not in best or c['c'] > best[k]['c']:
        best[k] = c
cutoffs = list(best.values())

os.makedirs('src/data/generated', exist_ok=True)
json.dump(list(options.values()), open('src/data/generated/options.json', 'w', encoding='utf8'), separators=(',', ':'))
json.dump(cutoffs, open('src/data/generated/cutoffs.json', 'w', encoding='utf8'), separators=(',', ':'))

per = collections.Counter(o['authority'] for o in options.values())
print('options :', len(options), dict(per))
print('cutoffs :', len(cutoffs))
print('pools   :', len({c['p'] for c in cutoffs}))
print('sets    :', sorted({(c['a'], c['y'], c['r']) for c in cutoffs}))
for o in list(options.values())[:3]:
    print('  ', o['id'][:44].ljust(44), o['collegeShort'][:30], o['branch'], o['city'])
