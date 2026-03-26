export interface WhoisResult {
  domain: string;
  registrar?: string;
  createdDate?: string;
  expiresDate?: string;
  nameservers?: string[];
  raw?: string;
  error?: string;
}

export interface DnsRecord {
  type: string;
  value: string;
  ttl?: number;
}

export interface DnsResult {
  domain: string;
  records: DnsRecord[];
  error?: string;
}

export async function lookupWhois(domain: string): Promise<WhoisResult> {
  try {
    const clean = domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '').trim();
    const res = await fetch(`https://rdap.org/domain/${clean}`);
    if (!res.ok) throw new Error(`RDAP lookup failed (${res.status})`);
    const data = await res.json();
    const ns = data.nameservers?.map((n: any) => n.ldhName).filter(Boolean) || [];
    const events = data.events || [];
    const getDate = (action: string) =>
      events.find((e: any) => e.eventAction === action)?.eventDate?.split('T')[0];
    const entities = data.entities || [];
    const registrar = entities.find((e: any) => e.roles?.includes('registrar'))?.vcardArray?.[1]?.find((v: any) => v[0] === 'fn')?.[3] || '';
    return { domain: clean, registrar, createdDate: getDate('registration'), expiresDate: getDate('expiration'), nameservers: ns };
  } catch (e: any) {
    return { domain, error: e.message };
  }
}

export async function lookupDns(domain: string): Promise<DnsResult> {
  try {
    const clean = domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '').trim();
    const types = ['A', 'AAAA', 'MX', 'NS', 'TXT', 'CNAME'];
    const records: DnsRecord[] = [];
    await Promise.all(
      types.map(async (type) => {
        try {
          const res = await fetch(`https://dns.google/resolve?name=${clean}&type=${type}`);
          const data = await res.json();
          if (data.Answer) {
            for (const a of data.Answer) {
              records.push({ type, value: a.data, ttl: a.TTL });
            }
          }
        } catch {}
      })
    );
    return { domain: clean, records };
  } catch (e: any) {
    return { domain, records: [], error: e.message };
  }
}
