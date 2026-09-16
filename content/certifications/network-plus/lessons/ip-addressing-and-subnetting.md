---
title: IP addressing and subnetting
objective: Read any IPv4 address and prefix, find its network, broadcast and usable range quickly, recognize special address ranges, and read a basic IPv6 address.
kind: lesson
estimatedMinutes: 60
prerequisites:
  - The OSI and TCP/IP models (this track)
  - Able to convert small numbers between binary and decimal, or willing to practice it here
completionChecks:
  - I can convert a prefix length such as /27 to a dotted-decimal mask and back.
  - I can find the network address, broadcast address and usable host range for any IPv4 address and prefix.
  - I can identify RFC 1918 private ranges, APIPA, loopback and multicast addresses on sight.
  - I can shorten an IPv6 address and recognize link-local, unique local and global unicast prefixes.
references:
  - title: RFC 1918, Address Allocation for Private Internets
    url: https://www.rfc-editor.org/rfc/rfc1918
  - title: RFC 4632, Classless Inter-domain Routing (CIDR)
    url: https://www.rfc-editor.org/rfc/rfc4632
  - title: RFC 4291, IP Version 6 Addressing Architecture
    url: https://www.rfc-editor.org/rfc/rfc4291
  - title: RFC 3927, Dynamic Configuration of IPv4 Link-Local Addresses
    url: https://www.rfc-editor.org/rfc/rfc3927
status: published
lastReviewed: 2026-09-15
---

Subnetting is the part of Network+ that people fear most, and it is also the part that becomes automatic after an hour of practice. Every addressing question on the exam, and most real-world "why can't these two machines talk" problems, comes down to one skill: given an address and a mask, say which network it belongs to.

## Anatomy of an IPv4 address

An IPv4 address is 32 bits written as four decimal numbers (octets) from 0 to 255, such as 192.168.10.77. A subnet mask, or its shorthand prefix length, says how many of those bits identify the network. In 192.168.10.77/24 the first 24 bits (192.168.10) are the network part and the remaining 8 bits (.77) identify the host.

The mask in dotted decimal has ones for the network bits and zeros for the host bits: /24 is 255.255.255.0, /16 is 255.255.0.0 and /8 is 255.0.0.0. Prefixes that do not land on an octet boundary produce masks such as 255.255.255.192 (/26) or 255.255.240.0 (/20). Memorize the eight possible octet values, 128, 192, 224, 240, 248, 252, 254 and 255, which correspond to one through eight ones in an octet.

Two addresses in every subnet are reserved. The lowest (all host bits zero) is the network address and the highest (all host bits one) is the broadcast address. Usable hosts = 2^(host bits) - 2. A /24 has 8 host bits, so 254 usable addresses; a /30 has 2 host bits, so 2 usable addresses, which is why /30 (and the newer /31) is used for point-to-point links between routers.

## The block-size method

You do not need to write out binary for every problem. Use the block size:

1. Find the interesting octet: the one where the mask is neither 255 nor 0.
2. Block size = 256 minus the mask value in that octet. For 255.255.255.192 the block size is 64; for 255.255.240.0 it is 16, in the third octet.
3. Subnets start at multiples of the block size: 0, 64, 128 and 192 for a block of 64.
4. The network address uses the largest multiple that does not exceed the host's value in that octet. The broadcast is the next multiple minus one.

Worked example: 192.168.10.77/26. Mask 255.255.255.192, block size 64, multiples 0, 64, 128, 192. The value 77 falls in the 64 block. Network 192.168.10.64, broadcast 192.168.10.127, usable 192.168.10.65 through .126, 62 hosts.

Second example: 10.20.37.200/22. Mask 255.255.252.0, interesting octet is the third, block size 4: 0, 4, 8 ... 36, 40. The value 37 falls in the 36 block. Network 10.20.36.0, broadcast 10.20.39.255, usable 10.20.36.1 through 10.20.39.254, 1022 hosts.

> **Tip:** When a question asks how many subnets and hosts you get from a fixed block, remember the pair: borrowing n bits creates 2^n subnets, and each has 2^h - 2 hosts where h is the remaining host bits. Splitting a /24 into /27s borrows 3 bits: 8 subnets of 30 hosts.

## Classes, CIDR and VLSM

Early IPv4 used classes based on the first octet: Class A (1-126, default /8), Class B (128-191, /16), Class C (192-223, /24), Class D (224-239, multicast) and Class E (240-255, experimental). The exam expects you to recognize them, but modern networks use CIDR (RFC 4632): any prefix length on any address, with routers matching the longest prefix. VLSM (variable-length subnet masking) means using different prefix lengths inside one network, so a two-router link gets a /30 and a hundred-user floor gets a /25, instead of wasting a /24 on each.

## Addresses with special meaning

| Range | Purpose |
| --- | --- |
| 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16 | Private (RFC 1918): free to use internally, never routed on the public internet, reach it through NAT |
| 127.0.0.0/8 | Loopback: the machine talking to itself (127.0.0.1) |
| 169.254.0.0/16 | APIPA (link-local): self-assigned when DHCP fails |
| 224.0.0.0/4 | Multicast: one sender, a group of receivers |
| 0.0.0.0/0 | The default route, meaning "everything else" |
| 255.255.255.255 | Limited broadcast on the local link |

Recognizing these is a fast exam win. A machine showing 169.254.x.x did not get a DHCP lease. An address in 172.32.0.0 is public, because the private block ends at 172.31.255.255.

The IPv4 space has about 4.3 billion addresses and they were exhausted years ago. Most organizations and homes use RFC 1918 space internally and share a few public addresses through NAT, which is covered in the network services lesson. That is why your laptop's address starts with 192.168 or 10 while a "what is my IP" website shows something different.

## IPv6 in one page

IPv6 addresses are 128 bits written as eight groups of four hexadecimal digits, such as 2001:0db8:0000:0000:0000:ff00:0042:8329. Two shortening rules apply: drop leading zeros in each group, and replace one run of all-zero groups with a double colon. That address becomes 2001:db8::ff00:42:8329.

Prefixes to recognize:

- **2000::/3** global unicast, public and routable
- **fe80::/10** link-local: every IPv6 interface has one automatically, used for neighbors on the same link and for router discovery
- **fc00::/7** unique local (in practice fd00::/8), the IPv6 counterpart of private space
- **ff00::/8** multicast; IPv6 has no broadcast at all
- **::1** loopback

Subnets are almost always /64, which leaves 64 bits for the interface identifier. Hosts can configure themselves with SLAAC (stateless address autoconfiguration) from router advertisements, with or without DHCPv6. Networks move to IPv6 gradually using dual stack (both protocols on every host), tunneling (IPv6 carried inside IPv4) or NAT64 (translation between the two).

> **Careful:** IPv6 has no ARP and no broadcast. Neighbor discovery uses ICMPv6 and multicast, so a firewall rule that blocks all ICMPv6 breaks IPv6 completely.

## Guided practice

Use paper for the first part and your own computer for the second.

1. Write the eight mask octet values (128 to 255) and their block sizes (128 down to 1) at the top of a page. Refer to them until they are memorized.
2. Solve these by hand: 172.16.45.200/22, 192.168.1.130/25, 10.0.5.9/30, 192.168.200.77/27 and 172.31.9.14/20. For each, write the mask, network, broadcast, usable range and host count. Answers are in Check yourself.
3. Open a terminal and run `ipconfig` (Windows), `ip a` (Linux) or `ifconfig` (macOS). Find your IPv4 address and mask, compute your network and broadcast addresses, and confirm the default gateway falls inside the usable range.
4. Look at your IPv6 addresses. Identify the link-local one (starts with fe80) and, if you have one, the global unicast one (starts with 2 or 3).
5. Time yourself on five new random problems. Under a minute each is the goal.

## Check yourself

1. **172.16.45.200/22**
   Mask 255.255.252.0. Network 172.16.44.0, broadcast 172.16.47.255, usable 172.16.44.1 to 172.16.47.254, 1022 hosts.
2. **192.168.1.130/25**
   Mask 255.255.255.128. Network 192.168.1.128, broadcast 192.168.1.255, usable .129 to .254, 126 hosts.
3. **10.0.5.9/30**
   Mask 255.255.255.252. Network 10.0.5.8, broadcast 10.0.5.11, usable .9 and .10, 2 hosts.
4. **192.168.200.77/27**
   Mask 255.255.255.224. Network 192.168.200.64, broadcast 192.168.200.95, usable .65 to .94, 30 hosts.
5. **172.31.9.14/20**
   Mask 255.255.240.0. Network 172.31.0.0, broadcast 172.31.15.255, usable 172.31.0.1 to 172.31.15.254, 4094 hosts.
6. **Is 172.32.5.5 a private address?**
   No. The private block is 172.16.0.0 through 172.31.255.255, so 172.32.x.x is public.
