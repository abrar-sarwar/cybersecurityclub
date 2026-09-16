---
title: Network security controls
objective: Describe defense in depth on a network, place firewalls, IDS/IPS, NAC and segmentation correctly, recognize the common Layer 2 and Layer 3 attacks, and name the control that mitigates each.
kind: lesson
estimatedMinutes: 55
prerequisites:
  - Switching, VLANs and Ethernet (this track)
  - Routing fundamentals (this track)
  - Core network services (this track)
diagram: defense-in-depth
completionChecks:
  - I can explain the CIA triad and the terms threat, vulnerability, exploit and risk with a network example for each.
  - I can describe firewall zones, a screened subnet, and the difference between an IDS and an IPS.
  - I can explain the 802.1X roles and how port security, DHCP snooping and dynamic ARP inspection stop specific attacks.
  - I can compare site-to-site and client VPNs and full versus split tunneling.
references:
  - title: NIST SP 800-207, Zero Trust Architecture
    url: https://csrc.nist.gov/pubs/sp/800/207/final
  - title: NIST SP 800-41 Rev. 1, Guidelines on Firewalls and Firewall Policy
    url: https://csrc.nist.gov/pubs/sp/800/41/r1/final
  - title: RFC 2865, Remote Authentication Dial In User Service (RADIUS)
    url: https://www.rfc-editor.org/rfc/rfc2865
status: published
lastReviewed: 2026-09-15
---

Network security is where this track meets the rest of the club's work. The Network+ security domain is small in weight but broad in vocabulary: it expects you to know what the common controls are, where they sit, and which attack each one stops. If you can draw a network and point at the control that would have caught a given attack, you are ready for both the exam and a Security+ study group.

## Vocabulary you will be tested on

The **CIA triad** names the three things security protects. **Confidentiality** keeps data from unauthorized eyes (encryption, access control). **Integrity** keeps data from unauthorized change (hashes, digital signatures). **Availability** keeps systems reachable (redundancy, backups, DDoS protection).

Four words are often confused. A **vulnerability** is a weakness, such as a switch still using its default password. A **threat** is anything that could exploit it, such as a bored student on the guest network. An **exploit** is the method or code that uses the weakness. **Risk** is the likelihood that the threat exploits the vulnerability multiplied by the impact if it does. Controls reduce risk and come in three families: **administrative** (policies, training), **technical** (firewalls, encryption, authentication) and **physical** (locks, cameras, badge readers).

## Defense in depth

No single control is enough, because every control fails sometimes. Defense in depth stacks independent layers so that an attacker who beats one meets another:

1. **Physical:** locked wiring closets, cameras, badge access, awareness of tailgating (following someone through a door) and shoulder surfing.
2. **Perimeter:** a firewall between the internet and the organization, with a screened subnet for public-facing servers.
3. **Network:** segmentation, network access control, access lists, intrusion detection.
4. **Host:** hardened operating systems, patching, endpoint protection.
5. **Application:** secure configuration and updates for the services users touch.
6. **Data:** encryption at rest and in transit, and tested backups.

Deception adds a layer of its own. A **honeypot** is a deliberately attractive fake system, and a **honeynet** is a network of them; nothing legitimate ever touches them, so any activity there is an alert with almost no false positives.

## Firewalls, zones and access lists

An **access control list** on a router or a stateless packet filter matches source and destination addresses, protocol and ports. Rules are evaluated top to bottom, the first match wins, and an implicit deny at the end drops everything unmatched. A **stateful firewall** tracks connections, so a permitted outbound request automatically admits its reply. A **next-generation firewall** adds application awareness, user identity and intrusion prevention. Content and URL filtering, often through a proxy, control what users may reach on the web.

Firewalls organize interfaces into **zones**. The inside is **trusted**, the internet is **untrusted**, and public-facing servers live in a **screened subnet** (still widely called a DMZ) between them. The internet may reach the screened subnet on specific ports only; the screened subnet may reach the inside almost never; the inside reaches the internet under policy. A web server compromised in a screened subnet cannot simply walk into the file servers.

An **intrusion detection system** watches a copy of traffic from a mirror port or a tap and raises alerts; an **intrusion prevention system** sits inline and blocks. Both use signatures of known attacks and anomaly detection against a baseline; both produce false positives that someone must tune.

## Segmentation and network access control

Segmentation puts systems with different trust levels on different VLANs and subnets, with a firewall or ACL between them: staff, guests, printers and cameras (IoT), industrial or building control systems (OT, SCADA, ICS), and personal devices (BYOD). Zero trust pushes this to **microsegmentation**, where even servers in the same rack must authenticate to each other.

**Network access control** decides who may join in the first place. **802.1X** has three roles: the **supplicant** (software on the laptop or phone), the **authenticator** (the switch or access point, which relays and enforces) and the **authentication server** (RADIUS, RFC 2865, often checking a directory). Until authentication succeeds, the port passes nothing but the authentication exchange. **MAC filtering** allows listed addresses only; because addresses are easy to spoof, treat it as a convenience, not a control. Several switch features close specific Layer 2 holes:

- **Port security** limits how many MAC addresses a port may learn and can shut the port (error-disabled) on violation, which defeats MAC flooding.
- **DHCP snooping** allows DHCP offers only from trusted uplink ports and records which address belongs to which port, which defeats rogue DHCP servers.
- **Dynamic ARP inspection** checks ARP replies against that table, which defeats ARP poisoning.
- **BPDU guard** shuts a port that receives spanning tree messages, which stops unauthorized switches.
- Disabling automatic trunk negotiation on access ports and moving the native VLAN to an unused ID defeats **VLAN hopping** by switch spoofing and double tagging.

Device hardening completes the list: change default credentials, disable unused ports and services, manage with SSH and HTTPS rather than Telnet and HTTP, use SNMPv3 rather than v2c, keep firmware patched, and keep management on its own network with a jump host.

## Attacks and the control that answers each

| Attack | What happens | First-line control |
| --- | --- | --- |
| DoS and DDoS | Traffic floods exhaust bandwidth or resources | Upstream scrubbing, rate limiting, redundancy |
| VLAN hopping | Attacker tags frames to reach a VLAN they are not in | Unused native VLAN, no trunk negotiation on access ports |
| MAC flooding | Fills the switch table so it floods traffic like a hub | Port security |
| ARP poisoning or spoofing | Fake ARP replies redirect traffic through the attacker (on-path attack) | Dynamic ARP inspection, encryption |
| DNS poisoning or spoofing | Forged DNS answers send users to fake sites | DNSSEC, encrypted DNS, patched resolvers |
| Rogue DHCP server | Fake server hands out a malicious gateway or DNS | DHCP snooping |
| Rogue access point or evil twin | Unauthorized AP, or a copy of your SSID | 802.1X, WPA3, wireless intrusion detection |
| Social engineering | Phishing, tailgating, shoulder surfing, dumpster diving | Training, badge policy, shredding, MFA |
| Malware | Malicious software spreading across the network | Segmentation, patching, endpoint protection |

## Identity, encryption and remote access

Data in transit is protected by TLS (HTTPS), SSH and IPsec; data at rest by disk and database encryption. Certificates prove identity within a **public key infrastructure**: a certificate authority signs a server's certificate, and clients trust the authority. A **self-signed** certificate is signed by nobody the client knows, so browsers warn; it is acceptable only for lab and internal use where you distribute the trust yourself.

For authentication, authorization and accounting, **RADIUS** (UDP, encrypts only the password) is the standard for network access and 802.1X, while **TACACS+** (TCP port 49, encrypts the whole payload, separates authorization) is preferred for administering network devices. **LDAP** and LDAPS query a directory, **SAML** carries single sign-on assertions between web applications, and **multifactor authentication** adds something you have or are to something you know. Grant **least privilege** through **role-based access control**, and add time-of-day or **geofencing** restrictions where they make sense.

Remote access uses VPNs. A **site-to-site** VPN joins two networks through their firewalls with IPsec. A **client-to-site** VPN connects one user's device; a **clientless** VPN offers a browser portal instead. In a **full tunnel** all of the user's traffic goes through the VPN, giving visibility and control; a **split tunnel** sends only corporate destinations through it, saving bandwidth at the cost of visibility.

Regulations shape all of this: PCI DSS for payment card data (segment it away from everything else), GDPR for personal data of EU residents, and **data locality** rules that say where data may be stored. Audits check that the controls you documented actually exist.

## Guided practice

Only audit equipment and networks you own.

1. Log in to your home router. Confirm the administrator password is not the default, remote management from the internet is off, WPS is off, firmware is current, and a separate guest or IoT network is available for smart devices.
2. Check your host firewall: `netsh advfirewall show allprofiles` on Windows, System Settings then Network then Firewall on macOS, or `sudo ufw status` on Linux. Confirm inbound connections are blocked by default.
3. On paper, draw the club room network as a defense-in-depth diagram: internet, firewall, screened subnet with a web server, core switch, and VLANs for members, printers and IoT. Mark where an IDS tap, 802.1X on access ports and DHCP snooping would go.
4. For each row of the attack table, write one sentence on how you would detect it: for example, two MAC addresses claiming one IP in the ARP table, or an unexpected DHCP server address in `ipconfig /all`.
5. Record your gateway's MAC from `arp -a` today and compare it next week. A change without any hardware change is a reason to investigate.

## Check yourself

1. **Where should a public web server sit?**
   In a screened subnet, reachable from the internet on specific ports and separated from the inside network by firewall policy.
2. **Name the three 802.1X roles.**
   Supplicant (client device), authenticator (switch or access point) and authentication server (RADIUS).
3. **Which switch feature stops a rogue DHCP server?**
   DHCP snooping, which accepts DHCP offers only on trusted ports.
4. **IDS or IPS: which one blocks?**
   The IPS, because it sits inline. An IDS watches a copy of traffic and alerts.
5. **What is the trade-off of split tunneling?**
   Less VPN load and faster internet access for the user, but corporate security tools no longer see the user's other traffic.
6. **RADIUS or TACACS+ for logging in to manage switches?**
   TACACS+ is usually preferred: it encrypts the whole exchange and separates command authorization.
