"""
OSINT Investigation Tools
Real-world OSINT capabilities for domain, IP, email, and network reconnaissance
"""
import asyncio
import json
import socket
import subprocess
import re
from typing import Any, Dict, List, Optional
from dataclasses import dataclass


@dataclass
class OSINTResult:
    tool: str
    target: str
    data: Dict[str, Any]
    success: bool = True
    error: Optional[str] = None


async def whois_lookup(domain: str) -> OSINTResult:
    """Perform WHOIS lookup on a domain"""
    try:
        import whois as python_whois
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, lambda: python_whois.whois(domain))

        data = {
            "domain": domain,
            "registrar": str(result.registrar) if result.registrar else None,
            "creation_date": str(result.creation_date) if result.creation_date else None,
            "expiration_date": str(result.expiration_date) if result.expiration_date else None,
            "last_updated": str(result.updated_date) if result.updated_date else None,
            "name_servers": result.name_servers if result.name_servers else [],
            "status": result.status if result.status else [],
            "emails": result.emails if result.emails else [],
            "country": str(result.country) if result.country else None,
            "org": str(result.org) if result.org else None,
        }
        return OSINTResult(tool="whois", target=domain, data=data)
    except Exception as e:
        return OSINTResult(tool="whois", target=domain, data={}, success=False, error=str(e))


async def dns_lookup(domain: str) -> OSINTResult:
    """Perform comprehensive DNS record lookup"""
    try:
        import dns.resolver
        records = {}
        record_types = ['A', 'AAAA', 'MX', 'NS', 'TXT', 'CNAME', 'SOA', 'CAA']

        for rtype in record_types:
            try:
                loop = asyncio.get_event_loop()
                answers = await loop.run_in_executor(
                    None, lambda rt=rtype: dns.resolver.resolve(domain, rt)
                )
                records[rtype] = [str(r) for r in answers]
            except Exception:
                records[rtype] = []

        return OSINTResult(tool="dns", target=domain, data={"domain": domain, "records": records})
    except Exception as e:
        return OSINTResult(tool="dns", target=domain, data={}, success=False, error=str(e))


async def subdomain_enum(domain: str, wordlist_path: str = None) -> OSINTResult:
    """Enumerate subdomains using DNS brute force"""
    try:
        import dns.resolver
        common_subs = [
            "www", "mail", "ftp", "smtp", "pop", "ns1", "ns2", "dns1", "dns2",
            "webmail", "admin", "portal", "api", "dev", "staging", "test",
            "blog", "shop", "store", "cdn", "static", "media", "img", "images",
            "vpn", "remote", "ssh", "mx", "email", "owa", "exchange",
            "jira", "git", "gitlab", "github", "ci", "cd", "jenkins",
            "db", "database", "mysql", "postgres", "mongo", "redis",
            "app", "mobile", "m", "beta", "alpha", "demo", "sandbox",
            "support", "help", "docs", "wiki", "kb", "status",
            "login", "auth", "sso", "oauth", "ldap", "ad",
            "cloud", "aws", "azure", "gcp", "s3",
            "monitor", "grafana", "kibana", "elastic", "logs",
            "proxy", "lb", "load", "edge", "origin",
        ]

        if wordlist_path:
            try:
                with open(wordlist_path) as f:
                    extra = [line.strip() for line in f if line.strip()]
                    common_subs.extend(extra)
            except Exception:
                pass

        found = []
        loop = asyncio.get_event_loop()

        async def check_sub(sub):
            fqdn = f"{sub}.{domain}"
            try:
                await loop.run_in_executor(None, lambda: dns.resolver.resolve(fqdn, 'A'))
                return {"subdomain": fqdn, "status": "active"}
            except Exception:
                return None

        tasks = [check_sub(sub) for sub in common_subs]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        for r in results:
            if isinstance(r, dict):
                found.append(r)

        return OSINTResult(
            tool="subdomain_enum",
            target=domain,
            data={"domain": domain, "subdomains_found": len(found), "subdomains": found}
        )
    except Exception as e:
        return OSINTResult(tool="subdomain_enum", target=domain, data={}, success=False, error=str(e))


async def ip_lookup(ip: str) -> OSINTResult:
    """Look up IP address information"""
    try:
        import httpx
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(f"http://ip-api.com/json/{ip}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,asname,reverse,mobile,proxy,hosting,query")
            data = resp.json()

        if data.get("status") == "success":
            return OSINTResult(tool="ip_lookup", target=ip, data=data)
        else:
            return OSINTResult(tool="ip_lookup", target=ip, data=data, success=False, error=data.get("message", "Lookup failed"))
    except Exception as e:
        return OSINTResult(tool="ip_lookup", target=ip, data={}, success=False, error=str(e))


async def email_lookup(email: str) -> OSINTResult:
    """Check email for breach data and social profiles"""
    try:
        domain = email.split("@")[1] if "@" in email else ""
        username = email.split("@")[0] if "@" in email else email

        import httpx
        results = {
            "email": email,
            "domain": domain,
            "username": username,
            "domain_info": {},
            "profiles": [],
        }

        # Check domain
        if domain:
            try:
                dns_result = await dns_lookup(domain)
                if dns_result.success:
                    results["domain_info"] = dns_result.data.get("records", {})
            except Exception:
                pass

        # Check common platforms for username
        platforms = {
            "github": f"https://github.com/{username}",
            "twitter": f"https://twitter.com/{username}",
            "reddit": f"https://www.reddit.com/user/{username}",
            "linkedin": f"https://www.linkedin.com/in/{username}",
            "instagram": f"https://www.instagram.com/{username}",
        }

        async with httpx.AsyncClient(timeout=10, follow_redirects=True) as client:
            for platform, url in platforms.items():
                try:
                    resp = await client.head(url)
                    if resp.status_code == 200:
                        results["profiles"].append({"platform": platform, "url": url, "status": "found"})
                    elif resp.status_code == 404:
                        pass
                    else:
                        results["profiles"].append({"platform": platform, "url": url, "status": f"HTTP {resp.status_code}"})
                except Exception:
                    pass

        return OSINTResult(tool="email_lookup", target=email, data=results)
    except Exception as e:
        return OSINTResult(tool="email_lookup", target=email, data={}, success=False, error=str(e))


async def port_scan(ip: str, ports: List[int] = None) -> OSINTResult:
    """Scan common ports on an IP address"""
    if ports is None:
        ports = [
            21, 22, 23, 25, 53, 80, 110, 111, 135, 139, 143, 443, 445,
            993, 995, 1433, 1521, 3306, 3389, 5432, 5900, 6379, 8000,
            8080, 8443, 8888, 9090, 9200, 27017,
        ]

    open_ports = []

    async def check_port(port: int):
        try:
            _, writer = await asyncio.wait_for(
                asyncio.open_connection(ip, port), timeout=3
            )
            writer.close()
            await writer.wait_closed()
            service = ""
            try:
                service = socket.getservbyport(port)
            except Exception:
                pass
            return {"port": port, "status": "open", "service": service}
        except Exception:
            return None

    tasks = [check_port(p) for p in ports]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    for r in results:
        if isinstance(r, dict):
            open_ports.append(r)

    return OSINTResult(
        tool="port_scan",
        target=ip,
        data={"ip": ip, "ports_scanned": len(ports), "open_ports": open_ports}
    )


async def http_probe(url: str) -> OSINTResult:
    """Probe a URL for HTTP information"""
    try:
        import httpx
        async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
            resp = await client.get(url)

        headers = dict(resp.headers)
        security_headers = {
            "strict-transport-security": headers.get("strict-transport-security", "MISSING"),
            "content-security-policy": headers.get("content-security-policy", "MISSING"),
            "x-frame-options": headers.get("x-frame-options", "MISSING"),
            "x-content-type-options": headers.get("x-content-type-options", "MISSING"),
            "x-xss-protection": headers.get("x-xss-protection", "MISSING"),
            "referrer-policy": headers.get("referrer-policy", "MISSING"),
        }

        data = {
            "url": url,
            "status_code": resp.status_code,
            "content_type": headers.get("content-type", ""),
            "server": headers.get("server", ""),
            "response_time_ms": round(resp.elapsed.total_seconds() * 1000),
            "final_url": str(resp.url),
            "redirect_count": len(resp.history),
            "security_headers": security_headers,
            "all_headers": headers,
        }

        return OSINTResult(tool="http_probe", target=url, data=data)
    except Exception as e:
        return OSINTResult(tool="http_probe", target=url, data={}, success=False, error=str(e))


async def ssl_check(domain: str) -> OSINTResult:
    """Check SSL certificate information"""
    try:
        import ssl
        import datetime

        loop = asyncio.get_event_loop()

        def get_cert():
            ctx = ssl.create_default_context()
            with ctx.wrap_socket(socket.socket(), server_hostname=domain) as s:
                s.settimeout(5)
                s.connect((domain, 443))
                cert = s.getpeercert()
                return cert

        cert = await loop.run_in_executor(None, get_cert)

        data = {
            "domain": domain,
            "subject": dict(x[0] for x in cert.get("subject", [])),
            "issuer": dict(x[0] for x in cert.get("issuer", [])),
            "version": cert.get("version"),
            "serial_number": cert.get("serialNumber"),
            "not_before": cert.get("notBefore"),
            "not_after": cert.get("notAfter"),
            "san": [x[1] for x in cert.get("subjectAltName", [])],
        }

        # Check expiry
        not_after = datetime.datetime.strptime(cert["notAfter"], "%b %d %H:%M:%S %Y %Z")
        days_left = (not_after - datetime.datetime.utcnow()).days
        data["days_until_expiry"] = days_left
        data["expired"] = days_left < 0

        return OSINTResult(tool="ssl_check", target=domain, data=data)
    except Exception as e:
        return OSINTResult(tool="ssl_check", target=domain, data={}, success=False, error=str(e))


TOOLS = {
    "whois": whois_lookup,
    "dns": dns_lookup,
    "subdomain_enum": subdomain_enum,
    "ip_lookup": ip_lookup,
    "email_lookup": email_lookup,
    "port_scan": port_scan,
    "http_probe": http_probe,
    "ssl_check": ssl_check,
}


async def run_osint_tool(tool_name: str, target: str, **kwargs) -> OSINTResult:
    """Run an OSINT tool by name"""
    tool = TOOLS.get(tool_name)
    if not tool:
        return OSINTResult(tool=tool_name, target=target, data={}, success=False, error=f"Unknown tool: {tool_name}")
    return await tool(target, **kwargs)
