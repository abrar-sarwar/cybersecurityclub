---
title: "Core network services: DNS, DHCP and NAT"
objective: Explain how DHCP hands out addresses, how DNS resolves names, how NAT and PAT share public addresses, and how to test each service from your own computer.
kind: lesson
estimatedMinutes: 55
prerequisites:
  - IP addressing and subnetting (this track)
  - Routing fundamentals (this track)
completionChecks:
  - I can describe the four DHCP messages and explain what a relay does.
  - I can trace a DNS lookup from the stub resolver to the authoritative server and name the common record types.
  - I can distinguish static NAT, dynamic NAT and PAT.
  - I can use nslookup or dig and ipconfig or ip to check which servers my machine is using.
references:
  - title: RFC 2131, Dynamic Host Configuration Protocol
    url: https://www.rfc-editor.org/rfc/rfc2131
  - title: RFC 1034, Domain Names - Concepts and Facilities
    url: https://www.rfc-editor.org/rfc/rfc1034
  - title: RFC 3022, Traditional IP Network Address Translator
    url: https://www.rfc-editor.org/rfc/rfc3022
  - title: Microsoft Learn - nslookup command reference
    url: https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/nslookup
status: published
lastReviewed: 2026-09-15
---

Three services do most of the quiet work on every network. DHCP gives devices their addresses, DNS turns names into addresses, and NAT lets thousands of private addresses share a handful of public ones. When any of them misbehaves the symptoms look like "the internet is down," so knowing how they work is the fastest route to a diagnosis.

## DHCP: getting an address without asking a human

A client with no address cannot send a normal packet, so DHCP (RFC 2131) starts with broadcasts. The exchange is remembered as DORA:

1. **Discover.** The client broadcasts from UDP port 68 to port 67: "any DHCP servers here?"
2. **Offer.** A server replies with a proposed address, mask, lease time and options.
3. **Request.** The client broadcasts its acceptance of one offer (so any other servers know to withdraw theirs).
4. **Acknowledge.** The server confirms, and the client starts using the address.

The client renews at half the lease time by contacting the server directly, and it tries again by broadcast at 87.5 percent if the server has not answered. Short leases (an hour) suit guest Wi-Fi where devices come and go; long leases (days) suit offices.

A server holds one **scope** per subnet: the pool of addresses, **exclusions** for addresses you assign manually, **reservations** that tie a MAC address to a fixed IP, and **options** that carry extra settings. The options you will meet most are the default gateway (option 3), DNS servers (option 6), domain name (option 15) and lease time (option 51).

Broadcasts do not cross routers, so a server can only hear clients on its own subnet unless something forwards for them. A **DHCP relay** (called an IP helper on many devices) on the router or Layer 3 switch turns the client's broadcast into a unicast to the server and stamps it with the subnet's gateway address so the server picks the right scope.

When DHCP fails, a Windows or macOS client assigns itself a 169.254.x.x APIPA address, which is the number one clue that the server, the relay or the link is broken. A scope with no free addresses (**pool exhaustion**) produces the same symptom for new devices only. IPv6 hosts can instead build their own address with SLAAC from a router advertisement, with DHCPv6 supplying only options (stateless) or full addresses (stateful).

## DNS: names to addresses

DNS (RFC 1034 and 1035) is a distributed database arranged as a tree: the root, then top-level domains such as .edu and .com, then registered names such as example.com, then hosts inside them. A lookup involves three roles:

- The **stub resolver** in your operating system checks its cache and the hosts file, then sends the query to a configured **recursive resolver** (your ISP, your campus, or a public service such as 1.1.1.1 or 8.8.8.8).
- The recursive resolver walks the tree on your behalf: it asks a root server, which points it to the .com servers, which point it to the **authoritative** servers for example.com, which hold the actual records. It caches every answer for the record's time to live (TTL).
- An answer served from the resolver's cache is labeled **non-authoritative**, which is normal and not an error.

| Record | Purpose |
| --- | --- |
| A | Name to IPv4 address |
| AAAA | Name to IPv6 address |
| CNAME | Alias of another name |
| MX | Mail servers for a domain, with priorities |
| NS | Authoritative name servers for a zone |
| PTR | Reverse lookup: address to name, in the in-addr.arpa or ip6.arpa tree |
| SOA | Zone metadata: primary server, serial number, timers |
| SRV | Location of a service (used by Active Directory, SIP) |
| TXT | Free text, used for SPF, DKIM and DMARC email policy and domain verification |

A **zone** is the portion of the tree one organization manages. Forward zones map names to addresses; reverse zones map addresses to names. The **primary** server holds the editable copy and **secondary** servers pull copies through zone transfers. Ordinary queries use UDP port 53; zone transfers and large answers use TCP 53.

Two security additions are easy to mix up. **DNSSEC** signs records so a resolver can detect forged answers (poisoning); it does not hide anything. **DNS over TLS** (port 853) and **DNS over HTTPS** (port 443) encrypt the conversation between your device and the resolver so nobody on the path can read or alter it; they do not prove the record is genuine.

> **Careful:** If you can `ping 1.1.1.1` but not `ping example.com`, the network is fine and DNS is not. Check which resolver the client received from DHCP, whether that resolver answers, and whether a stale cache (`ipconfig /flushdns` on Windows) is holding an old answer.

## NAT and PAT

RFC 1918 addresses are not routable on the internet, so the edge router or firewall rewrites them (RFC 3022). Three flavors:

- **Static NAT** maps one private address to one public address permanently, typically for a server that must accept inbound connections.
- **Dynamic NAT** hands out public addresses from a pool as internal hosts need them, one to one, and reclaims them later.
- **PAT** (port address translation, also called NAT overload) lets many private addresses share one public address by rewriting the source port as well. The router keeps a table of inside address and port to outside port, and uses it to steer replies back. Every home router does this, which is why fifty devices in a house appear to the internet as one address.

**Port forwarding** is a static rule that sends traffic arriving on a chosen public port to one internal host, the usual way to expose a game server or a lab service. Translation has costs: it breaks the end-to-end model, some protocols need special handling, logs show one address for many users, and it complicates IPv6 migration, which is what NAT64 with DNS64 addresses by letting IPv6-only clients reach IPv4 servers.

> **Note:** NAT hides internal addresses, but it is the firewall's policy that blocks unsolicited inbound connections. Treat NAT as an addressing tool, not a security control.

## Time and the port list

Logs, certificates and authentication all depend on accurate clocks. **NTP** (UDP 123) synchronizes time in a hierarchy of strata, where stratum 0 is a reference clock and each level below adds a hop. PTP delivers sub-microsecond accuracy for specialized networks, and NTS adds authenticated NTP.

Ports you should recall without looking: FTP 20/21, SSH and SFTP 22, Telnet 23, SMTP 25 (587 for submission), DNS 53, DHCP 67/68, TFTP 69, HTTP 80, NTP 123, SNMP 161/162, LDAP 389 (LDAPS 636), HTTPS 443, SMB 445, syslog 514, SQL Server 1433, RDP 3389, SIP 5060/5061.

## Guided practice

Use your own computer and your own network only.

1. Run `ipconfig /all` (Windows) or `nmcli dev show` (Linux) or `ipconfig getpacket en0` (macOS). Record whether DHCP is enabled, the DHCP server address, when the lease was obtained and expires, and the DNS servers handed out.
2. Run `nslookup example.com`. Note which server answered and the line "Non-authoritative answer." Then ask a different resolver directly: `nslookup example.com 1.1.1.1`.
3. Look up other record types: `nslookup -type=aaaa example.com`, `nslookup -type=ns example.com` and `nslookup -type=mx` for a domain that receives mail. On Linux or macOS use `dig example.com AAAA` and `dig +trace example.com` to watch the walk from root to authoritative server.
4. Do a reverse lookup: `nslookup 1.1.1.1`. Note the PTR result.
5. Compare the address from step 1 with the address a "what is my IP address" website shows you. The difference is PAT at your router. If you have a global IPv6 address, notice that it appears unchanged.
6. Optional: start a Wireshark capture with the filter `dhcp`, then run `ipconfig /release` followed by `ipconfig /renew` (you will lose connectivity for a few seconds). Identify all four DORA messages.

## Check yourself

1. **List the DHCP messages in order.**
   Discover, Offer, Request, Acknowledge.
2. **Clients on a new VLAN get 169.254 addresses, but the DHCP server on another VLAN is healthy. What is missing?**
   A DHCP relay (IP helper) on that VLAN's router interface, so broadcasts reach the server.
3. **Which record type returns an IPv6 address, which finds mail servers, and which does reverse lookups?**
   AAAA, MX and PTR.
4. **Fifty devices share one public address. Which translation is in use?**
   PAT (NAT overload), which distinguishes sessions by port number.
5. **DNSSEC or DNS over HTTPS: which one stops someone on the coffee shop Wi-Fi from reading your queries?**
   DNS over HTTPS (or DNS over TLS). DNSSEC only authenticates the records themselves.
