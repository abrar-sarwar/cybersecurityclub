---
title: Monitoring and troubleshooting methodology
objective: Apply the seven-step troubleshooting method, use the standard command-line and hardware tools, read monitoring data such as SNMP, syslog and flow records, and map common symptoms to likely causes.
kind: lesson
estimatedMinutes: 60
prerequisites:
  - IP addressing and subnetting (this track)
  - Switching, VLANs and Ethernet (this track)
  - Routing fundamentals (this track)
  - Core network services (this track)
completionChecks:
  - I can list the seven troubleshooting steps in order and give an example action for each.
  - I can choose the right tool for a stated symptom, from ping and traceroute to a cable tester or toner probe.
  - I can explain what SNMP, syslog, flow data and packet capture each provide and why baselines matter.
  - I can map symptoms such as a 169.254 address, CRC errors, a duplicate IP, a loop or jitter to a likely cause.
references:
  - title: Wireshark User's Guide
    url: https://www.wireshark.org/docs/wsug_html_chunked/
  - title: Microsoft Learn - tracert command reference
    url: https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/tracert
  - title: RFC 5424, The Syslog Protocol
    url: https://www.rfc-editor.org/rfc/rfc5424
  - title: RFC 3411, An Architecture for Describing SNMP Management Frameworks
    url: https://www.rfc-editor.org/rfc/rfc3411
status: published
lastReviewed: 2026-09-15
---

Troubleshooting is the heaviest domain on the exam and the skill you will use on day one of any technical job. The good news is that it is mostly method plus vocabulary: a fixed sequence of steps, a small set of tools, and a mental map from symptom to likely cause. This lesson also covers the operations material that keeps networks healthy between incidents: documentation, monitoring and recovery planning.

## The seven steps

CompTIA's methodology is tested as a sequence, so learn it in order.

1. **Identify the problem.** Gather information, question users, identify symptoms, ask what changed, and try to reproduce it. If several problems appear at once, approach them one at a time.
2. **Establish a theory of probable cause.** Question the obvious first (is it plugged in?), then work through the OSI layers top-down, bottom-up or by dividing the problem in half.
3. **Test the theory.** If it is confirmed, plan the fix. If not, form a new theory or escalate.
4. **Establish a plan of action and identify potential effects.** Who else does the change touch? Is there a maintenance window and a rollback plan?
5. **Implement the solution or escalate.** Follow change management; do not exceed your authority.
6. **Verify full system functionality** and put preventive measures in place.
7. **Document findings, actions and outcomes** so the next person, possibly you, starts ahead.

> **Tip:** Exam questions describe a technician who has just done one step and ask what comes next. Notice which step the story is in: "confirmed the cable was bad" is the end of step 3, so the next action is planning the replacement, not swapping it immediately.

## Operations that prevent the next incident

Documentation is the difference between a ten-minute fix and a two-day archaeology project: physical and logical diagrams, rack diagrams, cable maps, an IP address management (IPAM) record, an asset inventory with licenses and warranties, and service level agreements that say what "fixed" must mean. **Change management** requires a request, an approval, a scheduled window, a rollback plan and communication. **Configuration management** keeps a baseline configuration for each device type, the current production configuration and a backup you have actually restored from. **Life-cycle management** tracks end of life and end of support dates, applies firmware and software patches, and wipes devices at decommissioning.

Disaster recovery has its own vocabulary. **RPO** (recovery point objective) is how much data you can afford to lose, measured in time since the last backup; **RTO** (recovery time objective) is how long you can be down. **MTTR** is the mean time to repair and **MTBF** the mean time between failures. Recovery sites are **cold** (space and power only), **warm** (equipment, data restored on demand) or **hot** (running and synchronized). High availability designs are **active-active** (all nodes serve traffic) or **active-passive** (a standby takes over). Plans are exercised as tabletop discussions or full validation tests.

## Monitoring data and what each source tells you

- **SNMP** (ports 161 for polling and 162 for traps) lets a management station read counters from a device's management information base (MIB) by object identifier, and lets the device send traps when something happens. Versions 1 and 2c authenticate with a plain-text community string; use **SNMPv3**, which adds authentication and encryption.
- **Syslog** (RFC 5424, usually UDP 514) collects event messages with a facility and a severity from 0 (emergency) to 7 (debug). A collector or a SIEM aggregates and correlates logs from many devices.
- **Flow data** (NetFlow, sFlow, IPFIX) records who talked to whom, on which ports, and how much, without payload. It answers "what is eating the bandwidth?" cheaply.
- **Packet capture** with tcpdump or Wireshark shows everything, taken from a mirror (SPAN) port or a network tap. Use it when flow data has narrowed the question.
- **Interface counters** on a switch or router reveal physical problems: CRC errors and runts point at cabling or duplex, giants at MTU mismatches, drops at congestion. Port status words matter too: administratively down (someone shut it), error-disabled (a security feature tripped) or suspended (a bundle or VLAN mismatch).

Monitoring is only useful against a **baseline** of normal utilization, latency and error rates; alerts fire on deviation from it. Availability monitoring asks "is it up," performance monitoring asks "how well," and configuration monitoring asks "did it change." Neighbor discovery protocols (LLDP, and CDP on Cisco gear) tell you which device and port sit at the other end of a cable, and scheduled network discovery keeps the inventory honest.

## Tools

Software tools you should be able to run and read: `ping` (reachability and round-trip time using ICMP), `tracert` or `traceroute` (the path, one TTL at a time), `nslookup` or `dig` (name resolution), `ipconfig`, `ip` or `ifconfig` (addresses and leases), `arp` or `ip neigh` (address to MAC mappings), `netstat` or `ss` (open connections and listening ports), `tcpdump` and Wireshark (captures), a speed tester, and `nmap` for discovering hosts and open ports on networks you are authorized to scan. On network devices, the commands to recognize are `show interface`, `show mac address-table`, `show ip route`, `show arp`, `show vlan`, `show running-config` and `show power inline`.

Hardware tools: a **cable tester** checks wire maps for opens, shorts and split pairs; a **toner and probe** finds where a cable goes; a **loopback plug** tests a port; a time-domain reflectometer (or OTDR for fiber) reports the distance to a fault; a **visual fault locator** shines light through fiber; a **Wi-Fi analyzer** shows channels and signal; a **tap** copies traffic without a switch.

## From symptom to cause

| Symptom | Likely cause | Confirm with |
| --- | --- | --- |
| Address 169.254.x.x | DHCP server, relay or link problem; exhausted pool | `ipconfig /all`, check the scope and relay |
| Ping to an IP works, ping to a name fails | DNS | `nslookup`, check the resolver handed out by DHCP |
| Local hosts reachable, nothing beyond | Wrong default gateway or subnet mask, missing route | `ipconfig`, `route print`, `tracert` |
| Intermittent connectivity and conflict warnings | Duplicate IP address | ARP table showing two MACs for one IP |
| CRC errors and runts climbing on a port | Bad cable, bad connector, duplex mismatch, failing transceiver | Interface counters, cable tester, swap the cable |
| Link light off | Cable, port shut down or error-disabled, wrong transceiver | `show interface`, try another port |
| Whole segment slow, switch lights flashing constantly | Switching loop, spanning tree disabled or misconfigured | MAC table flapping, high CPU, trace the extra cable |
| One user in the wrong subnet after a desk move | Port in the wrong VLAN | `show vlan`, check the port assignment |
| Slow only during peak hours | Congestion, bandwidth limit, bottleneck | Interface utilization, flow data, baseline |
| Voice or video choppy | Jitter and latency, missing QoS | Continuous ping, compare variation, check queues |
| Phone or camera will not power on | PoE budget exceeded or wrong PoE standard | `show power inline`, device power class |
| Asterisks for one hop in traceroute, later hops fine | That router does not answer ICMP; usually harmless | Compare with the final hop reaching normally |
| Server unreachable through one router only | ACL blocking the traffic | Review the ACL, test from another subnet |

Performance vocabulary: **bandwidth** is capacity, **throughput** is what you actually get, **latency** is delay, **jitter** is variation in delay, and **packet loss** is what makes TCP slow and voice unintelligible.

## Guided practice

Everything runs on your own machine.

1. Take the scenario "two of the ten laptops in a study room lost internet after the furniture was rearranged." Write all seven steps on paper before touching anything: what you would ask, your first theory, how you would test it, and what you would document.
2. Build a healthy baseline. Run `ipconfig /all`, `ping` to your gateway, `ping 1.1.1.1`, `ping example.com`, `tracert -d 1.1.1.1`, `nslookup example.com`, `arp -a` and `netstat -an` (Linux and macOS: `ip a`, `ip route`, `ss -tln`). Save the output so you know what normal looks like.
3. Read your own interface counters: `Get-NetAdapterStatistics` in PowerShell, `ip -s link` on Linux or `netstat -i` on macOS. Note the error and drop columns.
4. Find a log entry about the network: Windows Event Viewer under System (look for DHCP-Client or DNS Client events), or `journalctl -u NetworkManager` on Linux. Assign it a syslog-style severity.
5. Start a Wireshark capture, run a four-packet ping and a traceroute, then stop. Identify the ICMP echo requests and replies, and watch the TTL in the traceroute packets increase by one each round.

## Check yourself

1. **A technician has just confirmed that a bad patch cable is the cause. What is the next step?**
   Establish a plan of action and identify potential effects, then implement it.
2. **What does a 169.254 address tell you?**
   The client never received a DHCP lease: check the link, the relay and the server's scope.
3. **Why prefer SNMPv3 over v2c?**
   It authenticates the manager and encrypts the data; v2c relies on a plain-text community string.
4. **Flow data or packet capture for finding which host is saturating an uplink?**
   Flow data. It is lightweight and answers who and how much; capture is for inspecting the contents afterward.
5. **Two devices report an address conflict. How do you find them?**
   Look for one IP address mapped to two MAC addresses in the ARP table or switch logs, then trace each MAC to its port.
6. **Interface counters show rising CRC errors. Which layer and what fix?**
   Layer 1 or 2: test or replace the cable, check the duplex settings on both ends and, on fiber, the transceiver.
