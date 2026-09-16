---
title: Routing fundamentals
objective: Explain how routers choose paths, compare static and dynamic routing protocols, read a routing table, and recognize first-hop redundancy and address translation at the network edge.
kind: lesson
estimatedMinutes: 50
prerequisites:
  - IP addressing and subnetting (this track)
  - Switching, VLANs and Ethernet (this track)
completionChecks:
  - I can read a routing table and predict which route a packet will use.
  - I can order longest prefix match, administrative distance and metric correctly.
  - I can compare RIP, OSPF, EIGRP and BGP by type and typical use.
  - I can explain what a default route, a default gateway and a first-hop redundancy protocol are for.
references:
  - title: RFC 2328, OSPF Version 2
    url: https://www.rfc-editor.org/rfc/rfc2328
  - title: RFC 4271, A Border Gateway Protocol 4 (BGP-4)
    url: https://www.rfc-editor.org/rfc/rfc4271
  - title: RFC 5798, Virtual Router Redundancy Protocol (VRRP) Version 3
    url: https://www.rfc-editor.org/rfc/rfc5798
  - title: Microsoft Learn - tracert command reference
    url: https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/tracert
status: published
lastReviewed: 2026-09-15
---

A switch moves frames within a network; a router moves packets between networks. What a router does with a packet in its first moment of decision-making explains most of what the exam asks about routing, and it explains a large share of the outages you will ever debug.

## What a router does with a packet

1. It receives a frame addressed to its own MAC, strips the Layer 2 header and reads the destination IP address of the packet inside.
2. It looks that address up in its routing table and picks an outgoing interface and, for non-local destinations, a next-hop address.
3. It decrements the TTL. If the TTL reaches zero the packet is dropped and an ICMP Time Exceeded message goes back to the sender. This is what traceroute exploits: it sends packets with TTL 1, 2, 3 and so on, and each router that drops one reveals itself.
4. It builds a new frame with its own MAC as source and the next hop's MAC (found with ARP) as destination, and sends it.

Notice what changes and what does not. The source and destination IP addresses stay the same all the way across the internet (unless NAT is involved), while the MAC addresses are rewritten on every hop.

Hosts make a simpler decision. If the destination is inside their own subnet, as decided by the subnet mask, they ARP for it directly. If not, they send the frame to the default gateway, the router on their subnet. A wrong gateway or a wrong mask produces the classic symptom "I can reach my neighbors but nothing else."

## Reading a routing table

Each entry holds a destination prefix, how the route was learned, the next hop or exit interface, and a metric. A simplified table:

```
Destination        Source     Next hop        AD/Metric
0.0.0.0/0          static     203.0.113.1     1/0
10.0.0.0/8         OSPF       10.1.0.2        110/20
10.1.0.0/16        static     10.1.0.2        1/0
10.1.2.0/24        RIP        10.1.0.3        120/2
192.168.5.0/24     connected  GigE0/1         0/0
```

When several routes could match a destination, the router decides in a fixed order:

1. **Longest prefix match.** The most specific route wins, regardless of how it was learned. A packet to 10.1.2.50 matches the /8, the /16 and the /24; the /24 wins even though RIP is the least trusted source.
2. **Administrative distance (AD)** breaks ties between routes to the same prefix from different sources. Lower is more trusted. Common defaults (Cisco's are the ones the exam uses): connected 0, static 1, external BGP 20, EIGRP 90, OSPF 110, RIP 120, internal BGP 200.
3. **Metric** breaks ties within one protocol: hop count for RIP, cost for OSPF, a composite of bandwidth and delay for EIGRP.

The entry 0.0.0.0/0 is the **default route**, the route of last resort. If no default route exists and nothing else matches, the packet is dropped and the sender may receive an ICMP Destination Unreachable. Home routers have exactly one default route, pointing at the ISP.

> **Tip:** Read "longest prefix, then AD, then metric" out loud a few times. Exam questions love to show a static /16 next to a dynamic /24 and ask which one carries the traffic. The more specific prefix wins before AD is even considered.

## Static versus dynamic routing

**Static routes** are typed in by a person. They are predictable, use no bandwidth or CPU, and never adapt. They suit small stub networks, default routes and lab setups. A **floating static route** is a static route with a deliberately high AD that only takes over when the dynamic route disappears.

**Dynamic routing protocols** let routers tell each other what they can reach and converge on new paths when links fail. They are grouped in two ways:

- **Interior gateway protocols (IGPs)** run inside one organization: RIP, OSPF, EIGRP. **Exterior gateway protocols** run between organizations: BGP.
- By algorithm. **Distance-vector** protocols share their whole table with neighbors and pick by hop count; RIP is the classic example, limited to 15 hops and slow to converge, and you will meet it mostly on exams. **Link-state** protocols share a map of links and let every router compute shortest paths; OSPF (RFC 2328) is the open standard, uses a cost derived from bandwidth, and scales with areas connected through a backbone area 0. **EIGRP** is Cisco's advanced distance-vector protocol with fast convergence and a composite metric. **Path-vector** BGP (RFC 4271) exchanges lists of autonomous systems and applies policy rather than pure shortest path; it is the routing protocol of the internet and increasingly of large data centers and cloud networks.

Route summarization (advertising 10.1.0.0/16 instead of 256 individual /24s) keeps tables small and hides internal changes from the rest of the network.

## First-hop redundancy and virtual IPs

A host has one default gateway address. If that router fails, every host on the subnet is stranded, even if a second router is sitting right there. First-hop redundancy protocols solve this by letting two or more routers share a **virtual IP** and virtual MAC address. One router is active and answers ARP for the virtual IP; the others stand by and take over within seconds when the active one stops sending hellos. HSRP is Cisco's version, VRRP (RFC 5798) is the open standard, and GLBP adds load sharing. Load balancers use the same virtual IP idea to front a pool of servers.

## Subinterfaces and translation at the edge

Two routing features from the switching world and the services world show up here:

- A **router-on-a-stick** connects one physical interface to a trunk and creates one subinterface per VLAN, each tagged with its 802.1Q ID and holding that VLAN's gateway address.
- At the internet edge the router usually performs **NAT or PAT**, rewriting private source addresses to its public address so that RFC 1918 hosts can reach the internet. The network services lesson covers translation in detail; for now, remember that it happens on the edge router or firewall and that it is why your traceroute switches from private to public addresses after the first hop or two.

Routers also stop broadcasts, so they define the boundary of every broadcast domain, and they are a natural place for access control lists.

## Guided practice

Everything here runs on your own machine and reads only your own routing information.

1. Show your routing table: `route print -4` (Windows), `ip route` (Linux) or `netstat -rn` (macOS). Find the default route (0.0.0.0 with mask 0.0.0.0 on Windows, `default via` on Linux) and the connected route for your own subnet. Note the interface each uses.
2. If you have both Wi-Fi and Ethernet, compare their metrics and predict which one carries a new connection. Windows lists an interface metric; lower wins.
3. Run `tracert -d example.com` (Windows) or `traceroute -n example.com` (Linux/macOS). The first hop should be your gateway. Count the hops, note where private addresses stop and public ones begin, and note any hops that show only asterisks (routers that do not send ICMP replies).
4. On paper, use the sample routing table above to decide the exit for packets to 10.1.2.9, 10.1.200.1, 10.77.1.1 and 8.8.8.8. Write which rule decided each one.
5. Draw two routers sharing the virtual IP 192.168.5.1 for a subnet. Describe, step by step, what happens to a host's traffic when the active router loses power.

## Check yourself

1. **A router has 10.0.0.0/8 via OSPF, 10.1.0.0/16 via a static route and 10.1.2.0/24 via RIP. Which route carries a packet to 10.1.2.50?**
   The RIP /24. Longest prefix match is decided before administrative distance.
2. **What happens when a packet's TTL reaches zero?**
   The router discards it and sends an ICMP Time Exceeded message to the source. Traceroute relies on this.
3. **Which protocol carries routes between internet service providers?**
   BGP, a path-vector exterior gateway protocol.
4. **As a packet crosses three routers, which addresses change and which stay the same?**
   The MAC addresses change on every hop; the IP addresses stay the same unless NAT is applied.
5. **Two routers on one subnet share a single gateway address for the hosts. What is this called?**
   A first-hop redundancy protocol such as VRRP or HSRP, using a virtual IP.
