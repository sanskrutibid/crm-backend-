// Property <-> Opportunity matching helpers (naya code, kisi purani file ko nahi chhuta)

const BUDGET_TOLERANCE = 0.1; // ±10%. Strict chahiye to 0 kar dein
const AREA_TOLERANCE = 0.1;

export function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function norm(v: any): string {
  return String(v ?? '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function letters(v: any): string {
  return norm(v).replace(/[^a-z]/g, '');
}

function num(v: any): number | null {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function extractNumber(v: any): number | null {
  const m = String(v ?? '').match(/\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) : null;
}

function toRupees(unit: any): number {
  const u = norm(unit);
  if (u.includes('cr')) return 10000000;
  if (u.includes('lac') || u.includes('lakh')) return 100000;
  if (u.includes('thousand') || u === 'k') return 1000;
  return 1;
}

function parsePriceString(s: any): number | null {
  const m = String(s ?? '')
    .replace(/,/g, '')
    .match(/([\d.]+)\s*(crore|cr|lacs|lac|lakh|l)?/i);
  if (!m) return null;
  const value = parseFloat(m[1]);
  if (!Number.isFinite(value) || value <= 0) return null;
  return value * toRupees(m[2] || '');
}

function toSqFt(value: number, unit: any): number | null {
  const u = letters(unit);
  if (!u || u === 'sqft' || u === 'sqfeet' || u === 'sqfoot') return value;
  if (u === 'sqmeter' || u === 'sqmetre' || u === 'sqmtr' || u === 'sqm') {
    return value * 10.7639;
  }
  if (u === 'sqyard' || u === 'sqyd') return value * 9;
  return null; // doosre units compare nahi hote
}

function purposeKind(purpose: any): 'buy' | 'rent' | 'other' {
  const p = norm(purpose);
  if (p === 'buy') return 'buy';
  if (p.includes('rent') || p.includes('lease') || p === 'pg') return 'rent';
  return 'other';
}

function kindFromText(text: string): 'buy' | 'rent' | 'unknown' {
  const hasRent = /rent|lease|\bpg\b/.test(text);
  const hasBuy = /sale|sell|buy|resale|pre launch|distress/.test(text);
  if (hasRent && !hasBuy) return 'rent';
  if (hasBuy && !hasRent) return 'buy';
  return 'unknown';
}

function propertyPurposeKind(p: any): 'buy' | 'rent' | 'unknown' {
  const flat = (v: any) =>
    (Array.isArray(v) ? v : [v]).filter((x) => typeof x === 'string').join(' ');

  const primary = kindFromText(norm(flat(p.fo) + ' ' + flat(p.forType)));
  if (primary !== 'unknown') return primary;

  return kindFromText(norm(flat(p.transaction)));
}

function typeMatches(lookingFor: any, p: any): boolean {
  const stop = ['residential', 'commercial', 'industrial', 'independent', 'the', 'and', 'cum'];
  const tokens = norm(lookingFor)
    .replace(/\bflat\b/g, 'apartment')
    .split(/[^a-z]+/)
    .filter((t) => t.length > 2 && !stop.includes(t));
  if (!tokens.length) return true;
  const ptxt = norm([p.propertyType, p.type, p.category].join(' ')).replace(
    /\bflat\b/g,
    'apartment',
  );
  return tokens.some((t) => ptxt.includes(t));
}

function localityList(p: any): string[] {
  const raw = [
    p.locality,
    p.location,
    ...(Array.isArray(p.localities) ? p.localities : [p.localities]),
  ];
  return raw
    .map((x: any) => (typeof x === 'string' ? x : x?.name))
    .map(norm)
    .filter(Boolean);
}

export function scoreProperty(
  opp: any,
  p: any,
): { score: number; matched: string[]; missed: string[] } | null {
  const matched: string[] = [];
  const missed: string[] = [];
  let earned = 0;
  let total = 0;

  const check = (label: string, weight: number, ok: boolean) => {
    total += weight;
    if (ok) {
      earned += weight;
      matched.push(label);
    } else {
      missed.push(label);
    }
  };

  // Purpose: Buy vs Rent mismatch ho to property hata do
  const oppKind = purposeKind(opp.purpose);
  const propKind = propertyPurposeKind(p);
  if (oppKind !== 'other' && propKind !== 'unknown' && oppKind !== propKind) {
    return null;
  }

  // Budget (30)
  const minB = num(opp.minBudget);
  const maxB = num(opp.maxBudget);
  if (maxB) {
    const f = toRupees(opp.budgetUnit);
    const lo = (minB || 0) * f * (1 - BUDGET_TOLERANCE);
    const hi = maxB * f * (1 + BUDGET_TOLERANCE);
    const price =
      oppKind === 'rent'
        ? num(p.rentPerMonth) ?? num(p.expectedPrice) ?? parsePriceString(p.price)
        : num(p.expectedPrice) ?? parsePriceString(p.price);
    check('Budget', 30, price !== null && price >= lo && price <= hi);
  }

  // Locality (25)
  const oppLocs = String(opp.locality || '')
    .split(',')
    .map(norm)
    .filter(Boolean);
  if (oppLocs.length) {
    const propLocs = localityList(p);
    const ok = oppLocs.some((o) =>
      propLocs.some((l) => l === o || l.includes(o) || o.includes(l)),
    );
    check('Locality', 25, ok);
  }

  // Bedroom (20)
  if (opp.bedroom) {
    const a = extractNumber(opp.bedroom);
    const b = extractNumber(p.bedroom ?? p.type);
    check('Bedroom', 20, a !== null && b !== null && a === b);
  }

  // Area (15): sirf tab jab dono taraf ke units compare ho sakein
  const minA = num(opp.minArea);
  const maxA = num(opp.maxArea);
  if (maxA) {
    const pArea = num(p.area) ?? num(p.builtUpArea) ?? num(p.carpetArea) ?? num(p.sqft);
    const pUnit =
      num(p.area) !== null
        ? p.areaUnit
        : num(p.builtUpArea) !== null
          ? p.builtUpAreaUnit
          : num(p.carpetArea) !== null
            ? p.carpetAreaUnit
            : 'Sq.Ft.';
    const lo = toSqFt(minA || 0, opp.areaUnit);
    const hi = toSqFt(maxA, opp.areaUnit);
    const pv = pArea !== null ? toSqFt(pArea, pUnit) : null;
    if (lo !== null && hi !== null) {
      check(
        'Area',
        15,
        pv !== null && pv >= lo * (1 - AREA_TOLERANCE) && pv <= hi * (1 + AREA_TOLERANCE),
      );
    }
  }

  // Property type (5)
  if (opp.lookingFor) {
    check('Property Type', 5, typeMatches(opp.lookingFor, p));
  }

  // Furnishing (5)
  if (opp.furnishing) {
    check('Furnishing', 5, letters(opp.furnishing) === letters(p.furnishing));
  }

  const score = total > 0 ? Math.round((earned / total) * 100) : 0;
  return { score, matched, missed };
}