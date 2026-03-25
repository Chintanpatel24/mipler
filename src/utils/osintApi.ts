export interface WhoisResult {
  domain: string;
  registrar?: string;
  createdDate?: string;
  expiresDate?: string;
  nameservers?: string[];
  status?: string[];
  raw?: string;
  error?: string;
}

export interface DnsResult {
  domain: string;
  records: {
    type: string;
    value: string;
    ttl?: number;
  }[];
  error?: string;
}

/**
 * WHOIS lookup using a public API (no key required).
 * Falls back to a secondary service if the first fails.
 */
export async function lookupWhois(domain: string): Promise<WhoisResult> {
  const cleanDomain = domain.trim().replace(/^https?:\/\//, '').split('/')[0];

  try {
    // Primary: use RDAP (official IANA protocol, no API key)
    const rdapRes = await fetch(`https://rdap.org/domain/${cleanDomain}`, {
      headers: { Accept: 'application/rdap+json' },
    });

    if (rdapRes.ok) {
      const data = await rdapRes.json();
      const nameservers = data.nameservers?.map(
        (ns: { ldhName: string }) => ns.ldhName
      ) || [];

      const events = data.events || [];
      const created = events.find((e: { eventAction: string }) => e.eventAction === 'registration')?.eventDate;
      const expires = events.find((e: { eventAction: string }) => e.eventAction === 'expiration')?.eventDate;

      const registrar = data.entities?.find(
        (e: { roles: string[] }) => e.roles?.includes('registrar')
      )?.vcardArray?.[1]?.find(
        (v: string[]) => v[0] === 'fn'
      )?.[3] || 'Unknown';

      return {
        domain: cleanDomain,
        registrar: typeof registrar === 'string' ? registrar : 'Unknown',
        createdDate: created,
        expiresDate: expires,
        nameservers,
        status: data.status || [],
      };
    }
  } catch {
    // Primary failed, continue to fallback
  }

  // Fallback: basic DNS-based info
  try {
    const dnsResult = await lookupDns(cleanDomain);
    return {
      domain: cleanDomain,
      raw: `DNS records found. Full WHOIS data unavailable via browser.\n\nA records: ${dnsResult.records
        .filter((r) => r.type === 'A')
        .map((r) => r.value)
        .join(', ') || 'none'}`,
    };
  } catch {
    return {
      domain: cleanDomain,
      error: 'Could not retrieve WHOIS data. Try the domain without protocol prefix.',
    };
  }
}

/**
 * DNS lookup using public DNS-over-HTTPS (Cloudflare or Google).
 */
export async function lookupDns(domain: string): Promise<DnsResult> {
  const cleanDomain = domain.trim().replace(/^https?:\/\//, '').split('/')[0];
  const types = ['A', 'AAAA', 'MX', 'TXT', 'NS', 'CNAME'];
  const allRecords: DnsResult['records'] = [];

  for (const type of types) {
    try {
      const res = await fetch(
        `https://cloudflare-dns.com/dns-query?name=${cleanDomain}&type=${type}`,
        {
          headers: { Accept: 'application/dns-json' },
        }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.Answer) {
          for (const ans of data.Answer) {
            allRecords.push({
              type,
              value: ans.data,
              ttl: ans.TTL,
            });
          }
        }
      }
    } catch {
      // Skip failed record type
    }
  }

  if (allRecords.length === 0) {
    return {
      domain: cleanDomain,
      records: [],
      error: 'No DNS records found or domain does not exist.',
    };
  }

  return {
    domain: cleanDomain,
    records: allRecords,
  };
}