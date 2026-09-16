---
title: Switching, VLANs and Ethernet
objective: Explain how Ethernet frames, MAC addresses and switches work, describe VLANs, trunks and spanning tree, and choose the right cabling and transceivers for a link.
kind: lesson
estimatedMinutes: 50
prerequisites:
  - The OSI and TCP/IP models (this track)
  - IP addressing and subnetting (this track)
completionChecks:
  - I can explain how a switch builds its MAC address table and what it does with an unknown destination.
  - I can describe access ports, trunk ports, 802.1Q tags and the native VLAN.
  - I can explain why loops are dangerous and how spanning tree elects a root bridge and blocks ports.
  - I can choose a copper or fiber cable and transceiver for a stated speed and distance.
references:
  - title: RFC 826, An Ethernet Address Resolution Protocol
    url: https://www.rfc-editor.org/rfc/rfc826
  - title: Wireshark wiki - VLAN (802.1Q)
    url: https://wiki.wireshark.org/VLAN
  - title: IEEE 802.3 Ethernet Working Group
    url: https://www.ieee802.org/3/
status: published
lastReviewed: 2026-09-15
---

Switches are the workhorses of every local network. Much of the Network Implementation domain is about what happens inside them: how frames are forwarded, how VLANs turn one physical switch into several logical networks, and how loops are prevented. It is also the layer where a surprising number of security problems live, so the vocabulary here pays off twice.

## Ethernet frames and MAC addresses

Ethernet (IEEE 802.3) carries data in frames. A frame has a destination MAC address, a source MAC address, an EtherType that says what is inside (0x0800 for IPv4, 0x86DD for IPv6, 0x0806 for ARP), a payload of 46 to 1500 bytes, and a frame check sequence (a CRC) that lets the receiver detect corruption.

A MAC address is 48 bits written in hexadecimal, such as 3C:22:FB:1A:2B:3C. The first 24 bits are the organizationally unique identifier (OUI), which identifies the manufacturer; the rest is assigned by that vendor. The address is burned into the network card but can be overridden in software, which is why MAC filtering is weak security and why modern phones randomize their Wi-Fi MAC. The all-ones address FF:FF:FF:FF:FF:FF is the broadcast address.

ARP (RFC 826) connects Layer 3 to Layer 2. When a host needs to send to an IP address on its own subnet, it broadcasts "who has 192.168.1.1?" and the owner replies with its MAC. Hosts cache the answer in an ARP table for a few minutes. IPv6 does the same job with neighbor discovery over ICMPv6 instead of ARP.

## How a switch forwards

A switch learns. Every time a frame arrives, the switch records the source MAC address and the port it came in on in its MAC address table (sometimes called the CAM table). To forward a frame, it looks up the destination MAC:

- **Known unicast:** send it out the one port where that MAC was learned.
- **Unknown unicast, broadcast or multicast:** flood it out every port in the same VLAN except the one it arrived on.

Entries age out, typically after five minutes, so the table reflects who is really connected.

Every switch port is its own collision domain, and with full duplex there are no collisions at all. The whole VLAN is one broadcast domain. Old hubs put every device in one shared collision domain, which is why they disappeared. Speed and duplex are usually autonegotiated; if one side is forced to full duplex and the other is left on auto, the auto side falls back to half duplex and you get late collisions, CRC errors and a link that crawls. Both ends must agree. The same is true of MTU: standard frames carry 1500 bytes, jumbo frames about 9000, and a mismatch along the path causes drops or fragmentation.

## VLANs and trunks

A VLAN is a broadcast domain defined in software. VLAN IDs run from 1 to 4094, VLAN 1 is the default, and the list of VLANs and their names lives in the switch's VLAN database. Networks use VLANs to separate staff from guests, printers from laptops, and phones from PCs, without buying a switch for each group. Each VLAN normally maps to one IP subnet.

- An **access port** belongs to one VLAN and sends untagged frames to the device plugged into it.
- A **trunk port** carries many VLANs between switches, or to a router or hypervisor. Each frame gets an 802.1Q tag: four bytes inserted after the source MAC, including a 12-bit VLAN ID.
- The **native VLAN** is the one VLAN a trunk carries untagged. It must match on both ends, and best practice is to set it to an unused VLAN so stray untagged frames go nowhere useful.
- A **voice VLAN** lets an IP phone tag its own traffic on a port whose PC traffic stays untagged.

Traffic cannot cross from one VLAN to another without a router. Two designs do this: a router-on-a-stick (one physical link, one subinterface per VLAN) or a Layer 3 switch with a switched virtual interface (SVI) per VLAN. The SVI address is the default gateway for that VLAN.

> **Careful:** A device in the wrong VLAN gets an address from the wrong DHCP scope, or none at all, and cannot reach its neighbors. "Wrong VLAN on the port" is one of the most common causes of a single user being cut off after a desk move.

## Spanning tree

Redundant links between switches are good for resilience and terrible for Ethernet, because frames have no time-to-live. One loop and a single broadcast circulates forever, multiplying each time it passes a switch: a broadcast storm that pins switch CPUs, corrupts MAC tables and takes the LAN down within seconds.

Spanning Tree Protocol (STP, IEEE 802.1D) and its faster successor Rapid STP (802.1w) prevent this by blocking redundant paths until they are needed. Switches exchange BPDUs and elect a **root bridge**: the switch with the lowest bridge ID, which is a priority (default 32768) followed by the MAC address. Lowest priority wins; ties go to the lowest MAC. Every other switch picks one **root port**, its best path to the root; each link gets one **designated port**; every remaining port is blocked (called alternate in RSTP). Classic STP ports move through blocking, listening, learning and forwarding; RSTP simplifies this to discarding, learning and forwarding.

Two practical habits: set the root bridge priority on your core switch on purpose instead of letting the oldest switch win, and enable PortFast with BPDU guard on access ports so a user plugging in a rogue switch does not reshape your tree.

## Link aggregation, PoE and cabling

**Link aggregation** (LACP, IEEE 802.1AX) bundles several physical links into one logical link for bandwidth and redundancy; the settings must match on both ends.

**Power over Ethernet** delivers power on the data cable: 802.3af supplies up to 15.4 W per port, 802.3at (PoE+) up to 30 W, and 802.3bt up to 60 or 90 W. Every switch has a total power budget; a camera or phone that will not boot on a full switch is usually a budget problem.

**Copper** uses twisted-pair cable with RJ45 connectors. Cat5e carries 1 Gbps to 100 m; Cat6 carries 10 Gbps only to about 55 m; Cat6a carries 10 Gbps the full 100 m. Runs through air-handling spaces need plenum-rated jackets. Direct-attach copper (DAC, twinaxial) links equipment inside a rack. Coaxial with F-type connectors is what a cable ISP brings to the building.

**Fiber** comes in multimode (short reach, inexpensive optics, typical in a building) and single-mode (long reach, laser optics, between buildings and across cities). Common connectors are LC, SC, ST and MPO. Transceivers plug into switch ports: SFP for 1 Gbps, SFP+ for 10 Gbps, QSFP+ for 40 Gbps, QSFP28 for 100 Gbps. Both ends must use the same fiber type and wavelength.

## Where switches sit: topologies

Nearly every LAN is a physical **star**: devices connect to a switch. Campus designs stack stars into a **three-tier** hierarchy of access, distribution and core switches, or a **collapsed core** where distribution and core merge for smaller sites. Data centers prefer **spine-and-leaf**, where every leaf switch connects to every spine so any server can reach any other in a predictable number of hops; that server-to-server traffic is called east-west, while traffic entering or leaving the data center is north-south. Full and partial **mesh**, **hub-and-spoke** and **point-to-point** describe how sites connect over a WAN.

## Guided practice

Use only your own computer and network.

1. Run `arp -a` (Windows or macOS) or `ip neigh` (Linux). Find the entry for your default gateway and write down its MAC address. Look up the first three bytes in Wireshark's OUI lookup (Tools menu) or any OUI search site to see the vendor.
2. Find your own MAC with `getmac /v` (Windows), `ip link` (Linux) or `ifconfig` (macOS). If the second hex digit is 2, 6, A or E, the address is locally administered, which usually means the operating system randomized it.
3. On paper, draw two switches joined by a trunk. Put VLAN 10 (staff) and VLAN 20 (guest) access ports on each. Mark the native VLAN, add an SVI for each VLAN, and count the broadcast domains and collision domains.
4. Draw three switches connected in a triangle with priorities 4096, 32768 and 32768. Elect the root, mark each root port and designated port, and identify the one blocked port.
5. Optional: in Wireshark, apply the filter `arp` and watch requests and replies while you ping your gateway. Try the filter `vlan` too. You will probably see nothing, because access ports strip tags before frames reach your computer.

## Check yourself

1. **A switch receives a frame for a MAC address it has not learned. What does it do?**
   Floods it out every port in that VLAN except the one it arrived on.
2. **Which VLAN travels untagged across a trunk?**
   The native VLAN. Both ends must agree on it.
3. **How is the STP root bridge chosen?**
   Lowest bridge ID: lowest priority first, then lowest MAC address.
4. **Why is a duplex mismatch a problem?**
   The half-duplex side sees late collisions and CRC errors; throughput collapses. Set both ends to auto or to the same fixed values.
5. **Which copper cable supports 10 Gbps over a 90 m run?**
   Cat6a. Cat6 only reaches about 55 m at 10 Gbps.
