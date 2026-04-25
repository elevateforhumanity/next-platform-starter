/**
 * lib/industry/bls.ts
 *
 * Bureau of Labor Statistics (BLS) Public Data API v2 client.
 *
 * Fetches employment projections and wage data by SOC code.
 * Free API key: https://data.bls.gov/registrationEngine/
 * Set BLS_API_KEY in environment (optional — unregistered allows 25 req/day).
 *
 * Series ID format:
 *   OES national wages:  OESNATM1XXXXXXXXXX  (X = 8-digit SOC without hyphen/dot)
 *   Employment proj:     EP series (Employment Projections program)
 *
 * Docs: https://www.bls.gov/developers/api_signature_v2.htm
 */

const BASE = 'https://api.bls.gov/publicAPI/v2';

export interface BlsWageData {
  soc_code: string;
  median_annual_wage: number | null;
  entry_wage: number | null;        // 10th percentile
  experienced_wage: number | null;  // 90th percentile
  employment_count: number | null;
  year: number;
}

export interface BlsProjectionData {
  soc_code: string;
  employment_2022: number | null;
  employment_2032: number | null;
  projected_growth_pct: number | null;
  projected_growth_cat: string | null; // 'much faster' | 'faster' | 'average' | 'slower' | 'decline'
  projected_openings: number | null;
  median_annual_wage: number | null;
  typical_education: string | null;
}

export interface BlsOccupationData {
  wages: BlsWageData;
  projections: BlsProjectionData;
}

/** Convert SOC code '21-1093.00' → OES series ID 'OESNATM1210930000' */
function socToOesSeries(socCode: string, percentile: 'median' | 'p10' | 'p90' | 'employment'): string {
  const digits = socCode.replace(/[-\.]/g, '').padEnd(8, '0').slice(0, 8);
  const dataTypeMap = {
    median:     '03', // median annual wage
    p10:        '01', // 10th percentile
    p90:        '09', // 90th percentile
    employment: '01', // employment (different series prefix)
  };
  if (percentile === 'employment') {
    return `OESNATM1${digits}01`; // employment count
  }
  return `OESNATM1${digits}${dataTypeMap[percentile]}`;
}

async function blsPost(seriesIds: string[]): Promise<any> {
  const body: any = {
    seriesid: seriesIds,
    startyear: '2023',
    endyear: '2024',
  };
  if (process.env.BLS_API_KEY) {
    body.registrationkey = process.env.BLS_API_KEY;
  }

  const res = await fetch(`${BASE}/timeseries/data/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    next: { revalidate: 0 },
  });

  if (!res.ok) throw new Error(`BLS API → ${res.status} ${res.statusText}`);
  return res.json();
}

function extractLatestValue(series: any): number | null {
  const data = series?.data;
  if (!Array.isArray(data) || data.length === 0) return null;
  // BLS returns newest first
  const latest = data[0];
  const val = parseFloat(latest?.value ?? '');
  return isNaN(val) ? null : val;
}

/** Fetch wage data for a SOC code from BLS OES program. */
export async function fetchBlsWages(socCode: string): Promise<BlsWageData> {
  const seriesIds = [
    socToOesSeries(socCode, 'median'),
    socToOesSeries(socCode, 'p10'),
    socToOesSeries(socCode, 'p90'),
  ];

  try {
    const data = await blsPost(seriesIds);
    const results = data?.Results?.series ?? [];

    const byId: Record<string, any> = {};
    for (const s of results) byId[s.seriesID] = s;

    return {
      soc_code: socCode,
      median_annual_wage: extractLatestValue(byId[seriesIds[0]]),
      entry_wage:         extractLatestValue(byId[seriesIds[1]]),
      experienced_wage:   extractLatestValue(byId[seriesIds[2]]),
      employment_count:   null, // fetched separately via OES employment series
      year: 2024,
    };
  } catch (err) {
    return {
      soc_code: socCode,
      median_annual_wage: null,
      entry_wage: null,
      experienced_wage: null,
      employment_count: null,
      year: 2024,
    };
  }
}

/**
 * Fetch employment projections from BLS Employment Projections program.
 * Uses the OOH (Occupational Outlook Handbook) JSON endpoint — no API key needed.
 * Falls back gracefully if the SOC code isn't in the projections dataset.
 */
export async function fetchBlsProjections(socCode: string): Promise<BlsProjectionData> {
  try {
    // OOH data endpoint — returns projections for all occupations
    const res = await fetch(
      `https://data.bls.gov/projections/occupationData?occupation=${encodeURIComponent(socCode)}`,
      { next: { revalidate: 0 } }
    );

    if (!res.ok) throw new Error(`OOH ${res.status}`);
    const data = await res.json();
    const occ = data?.occupation ?? data?.[0];

    if (!occ) throw new Error('No projection data');

    const growthPct = parseFloat(occ.percentChange ?? occ.percent_change ?? '');
    const growthCat = classifyGrowth(isNaN(growthPct) ? null : growthPct);

    return {
      soc_code: socCode,
      employment_2022:    parseInt(occ.employment2022 ?? occ.employment_2022 ?? '0', 10) || null,
      employment_2032:    parseInt(occ.employment2032 ?? occ.employment_2032 ?? '0', 10) || null,
      projected_growth_pct: isNaN(growthPct) ? null : growthPct,
      projected_growth_cat: growthCat,
      projected_openings: parseInt(occ.openings ?? '0', 10) || null,
      median_annual_wage: parseInt(occ.medianWage ?? occ.median_wage ?? '0', 10) || null,
      typical_education:  occ.typicalEducation ?? occ.typical_education ?? null,
    };
  } catch {
    // Graceful fallback — return nulls, caller will use O*NET data only
    return {
      soc_code: socCode,
      employment_2022: null,
      employment_2032: null,
      projected_growth_pct: null,
      projected_growth_cat: null,
      projected_openings: null,
      median_annual_wage: null,
      typical_education: null,
    };
  }
}

function classifyGrowth(pct: number | null): string | null {
  if (pct === null) return null;
  if (pct >= 15) return 'much faster than average';
  if (pct >= 8)  return 'faster than average';
  if (pct >= 3)  return 'about as fast as average';
  if (pct >= 0)  return 'slower than average';
  return 'decline';
}

export function isBlsConfigured(): boolean {
  // BLS works without a key (25 req/day limit) — always available
  return true;
}
