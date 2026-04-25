/**
 * lib/industry/careeronestop.ts
 *
 * CareerOneStop API client (US DOL / USDOL-funded).
 *
 * CareerOneStop provides certifications, local wage data, job postings,
 * and apprenticeship counts by occupation and location.
 *
 * Free API key: https://www.careeronestop.org/Developers/WebAPI/web-api.aspx
 * Set CAREERONESTOP_USER_ID and CAREERONESTOP_API_KEY in environment.
 *
 * Docs: https://www.careeronestop.org/Developers/WebAPI/technical-information.aspx
 */

const BASE = 'https://api.careeronestop.org/v1';

export interface CareerOneStopCertification {
  name: string;
  organization: string;
  url: string;
}

export interface CareerOneStopData {
  soc_code: string;
  location: string;
  certifications: CareerOneStopCertification[];
  apprenticeship_count: number;
  job_postings_count: number;
  local_median_wage: number | null;
  top_employers: { name: string; location: string }[];
}

function headers(): HeadersInit {
  const userId = process.env.CAREERONESTOP_USER_ID;
  const apiKey = process.env.CAREERONESTOP_API_KEY;
  if (!userId || !apiKey) throw new Error('CAREERONESTOP_USER_ID and CAREERONESTOP_API_KEY must be set');
  return {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
}

async function cosGet<T>(path: string): Promise<T> {
  const userId = process.env.CAREERONESTOP_USER_ID;
  const res = await fetch(`${BASE}/${userId}${path}`, {
    headers: headers(),
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`CareerOneStop ${path} → ${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

/** Fetch certifications for a keyword (occupation title). */
async function fetchCertifications(keyword: string): Promise<CareerOneStopCertification[]> {
  try {
    const data = await cosGet<any>(
      `/certificationfinder/${encodeURIComponent(keyword)}/0/0/0/0/0/0/0/5/json`
    );
    return (data?.CertList ?? []).slice(0, 10).map((c: any) => ({
      name: c.CertName ?? '',
      organization: c.Organization ?? '',
      url: c.CertURL ?? '',
    }));
  } catch {
    return [];
  }
}

/** Fetch local wage data for a SOC code and state. */
async function fetchLocalWage(socCode: string, stateAbbr: string = 'IN'): Promise<number | null> {
  try {
    const data = await cosGet<any>(
      `/wages/${encodeURIComponent(socCode)}/${stateAbbr}/NL/0/1/json`
    );
    const wage = data?.OccupationDetail?.[0]?.Wages?.StateWagesList?.[0]?.Median;
    return wage ? parseInt(wage, 10) : null;
  } catch {
    return null;
  }
}

/** Fetch apprenticeship count for a keyword. */
async function fetchApprenticeshipCount(keyword: string): Promise<number> {
  try {
    const data = await cosGet<any>(
      `/apprenticeship/${encodeURIComponent(keyword)}/IN/0/10/json`
    );
    return data?.ApprenticeshipCount ?? 0;
  } catch {
    return 0;
  }
}

/** Fetch job postings count for a SOC code in Indiana. */
async function fetchJobPostings(socCode: string): Promise<number> {
  try {
    const data = await cosGet<any>(
      `/jobsearch/${encodeURIComponent(socCode)}/IN/0/10/json`
    );
    return data?.TotalJobsFound ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Fetch all CareerOneStop data for an occupation.
 * @param socCode  e.g. '21-1093.00'
 * @param title    Occupation title for keyword searches
 * @param state    State abbreviation (default: 'IN' for Indiana)
 */
export async function fetchCareerOneStopData(
  socCode: string,
  title: string,
  state: string = 'IN',
): Promise<CareerOneStopData> {
  const keyword = title.split(',')[0].trim(); // use first part of title as keyword

  const [certifications, localWage, apprenticeshipCount, jobPostings] = await Promise.allSettled([
    fetchCertifications(keyword),
    fetchLocalWage(socCode, state),
    fetchApprenticeshipCount(keyword),
    fetchJobPostings(socCode),
  ]);

  return {
    soc_code: socCode,
    location: state,
    certifications: certifications.status === 'fulfilled' ? certifications.value : [],
    apprenticeship_count: apprenticeshipCount.status === 'fulfilled' ? apprenticeshipCount.value : 0,
    job_postings_count: jobPostings.status === 'fulfilled' ? jobPostings.value : 0,
    local_median_wage: localWage.status === 'fulfilled' ? localWage.value : null,
    top_employers: [], // requires separate employer API call — omit for now
  };
}

export function isCareerOneStopConfigured(): boolean {
  return !!(process.env.CAREERONESTOP_USER_ID && process.env.CAREERONESTOP_API_KEY);
}
