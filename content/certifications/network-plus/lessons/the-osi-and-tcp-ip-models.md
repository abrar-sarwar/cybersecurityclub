---
title: The OSI and TCP/IP models
objective: Describe the seven OSI layers and the four TCP/IP layers, map common protocols and devices to them, and use the layers to reason about where a network problem lives.
kind: lesson
estimatedMinutes: 40
prerequisites:
  - Comfortable opening a terminal or command prompt on your own computer
diagram: network-layers
completionChecks:
  - I can name the seven OSI layers in order and give one protocol or device for each.
  - I can explain encapsulation and name the PDU at layers 1 through 4.
  - I can map the four TCP/IP layers onto the OSI layers.
  - I can say which layer a symptom such as "no link light" or "the name does not resolve" points to.
references:
  - title: RFC 1122, Requirements for Internet Hosts - Communication Layers
    url: https://www.rfc-editor.org/rfc/rfc1122
  - title: RFC 9293, Transmission Control Protocol (TCP)
    url: https://www.rfc-editor.org/rfc/rfc9293
  - title: Wireshark User's Guide
    url: https://www.wireshark.org/docs/wsug_html_chunked/
status: published
lastReviewed: 2026-09-15
---

Every network conversation, from a ping across your living room to a video call across an ocean, is handled by layers of software and hardware that each do one job and hand the result to the next. The OSI and TCP/IP models are the two standard ways of naming those layers. Network+ tests them directly, but the practical reason to learn them is this: once you can place a symptom on a layer, you know which tool to reach for and which questions to ask.

## Why layers exist

A web browser should not care whether you are on Ethernet, Wi-Fi or a cellular link, and a network card should not need to understand HTTP. Layering keeps each part replaceable: swap the physical medium and the application never notices. It also gives engineers a shared vocabulary. When a colleague says "I think this is a Layer 2 problem," everyone understands that they mean switching, MAC addresses and frames, not routing or DNS.

The OSI model (Open Systems Interconnection) is a seven-layer reference published by ISO. TCP/IP, the protocol suite the internet actually runs on, is usually described with four layers (RFC 1122). Both are maps, not laws; real protocols sometimes straddle a boundary.

## The seven OSI layers

Read the table from the bottom up, because that is the order in which data arrives.

| Layer | Name | What it does | Unit (PDU) | Examples |
| --- | --- | --- | --- | --- |
| 7 | Application | Interface to the program that wants to communicate | Data | HTTP, DNS, SMTP, SSH |
| 6 | Presentation | Formatting, encoding, compression, encryption | Data | TLS, JPEG, UTF-8 |
| 5 | Session | Starting, maintaining and ending a dialogue | Data | Session handling in SMB, SIP, RPC |
| 4 | Transport | End-to-end delivery between programs using port numbers | Segment (TCP) or datagram (UDP) | TCP, UDP |
| 3 | Network | Logical addressing and path selection across networks | Packet | IPv4, IPv6, ICMP, routers |
| 2 | Data link | Delivery between neighbors on one link using MAC addresses | Frame | Ethernet, 802.11, switches, access points |
| 1 | Physical | Bits on a medium: voltage, light, radio | Bit | Cables, connectors, transceivers, hubs |

A common bottom-up mnemonic is "Please Do Not Throw Sausage Pizza Away." Use whichever one sticks; the exam cares that you know the order and the job of each layer.

Layers 5, 6 and 7 cause the most confusion. TCP/IP folds them into a single application layer, and exam questions about them are usually recognition: encryption and formatting belong to presentation, dialogue control to session, and the protocols users interact with (HTTP, DNS, SMTP) to application.

Devices map to layers too. A hub or repeater is Layer 1; a switch reads destination MAC addresses at Layer 2; a router reads destination IP addresses at Layer 3; a load balancer usually works at Layer 4 (ports) or Layer 7 (URLs); and a firewall can inspect anything from Layer 3 addresses to Layer 7 content.

## Encapsulation: down one stack, up the other

When you load a web page, the browser hands HTTP data to the transport layer. TCP adds a header with source and destination ports and a sequence number, producing a segment. IP wraps that in a packet with source and destination IP addresses. Ethernet (or Wi-Fi) wraps the packet in a frame with source and destination MAC addresses and a checksum, and the physical layer turns the frame into signals. Each wrapper is a header added by one layer; this is encapsulation.

On the receiving side the process reverses. The network card checks the frame's checksum and MAC address, strips the frame header, and passes the packet up. IP checks the destination address and hands the segment to TCP. TCP uses the destination port to deliver the data to the right program. Each layer reads only its own header and treats everything inside as opaque payload.

Two details come up often:

- **MTU.** Standard Ethernet carries up to 1500 bytes of payload per frame. Larger IP packets must be fragmented or, with TCP, avoided through path MTU discovery.
- **Ports.** TCP and UDP ports are 16-bit numbers (0-65535). Servers listen on well-known ports such as 22 for SSH, 53 for DNS, 80 for HTTP and 443 for HTTPS; the client side usually picks a temporary high port.

> **Note:** TCP is connection-oriented: it opens a session with a three-way handshake (SYN, SYN-ACK, ACK), numbers every byte and retransmits what is lost. UDP sends datagrams with no handshake and no retransmission, which suits DNS queries, video and voice, where waiting for a retransmission is worse than losing one packet.

## The TCP/IP model

TCP/IP describes the same journey with four layers:

| TCP/IP layer | Covers OSI layers | Typical contents |
| --- | --- | --- |
| Application | 5, 6, 7 | HTTP, DNS, DHCP, SMTP, TLS |
| Transport | 4 | TCP, UDP |
| Internet | 3 | IPv4, IPv6, ICMP, routing |
| Link (network access) | 1, 2 | Ethernet, Wi-Fi, ARP, cables |

Some textbooks split the link layer in two and teach a five-layer model. If a question says "TCP/IP model," assume four layers unless told otherwise, and remember that both models put IP at the network (internet) layer and TCP and UDP at transport.

## Using the layers to troubleshoot

The models earn their keep when something breaks. Three habits:

1. **Bottom-up** when nothing works. Is the cable connected and the link light on (Layer 1)? Does the machine have a MAC neighbor for its gateway (Layer 2)? Does it have an IP address and can it ping the gateway (Layer 3)? Can it open a TCP connection to port 443 (Layer 4)? Only then look at the application.
2. **Top-down** when one application fails while others work. A browser error with a working ping points at DNS, TLS or the application, not at the cable.
3. **Divide and conquer.** Start in the middle. If `ping 1.1.1.1` works but `ping example.com` fails, Layers 1 through 3 are fine and the problem is name resolution.

> **Tip:** Write the layer next to every symptom in your notes as you study. "169.254 address" is Layer 3 (no DHCP lease). "Link light off" is Layer 1. "Certificate warning" is presentation or application. The habit pays off on the exam and on a help desk.

## Guided practice

You will look at real encapsulation on your own computer. Capture only your own traffic, on a network you own or are permitted to use.

1. Install Wireshark from wireshark.org. On Windows, accept the Npcap prompt so it can capture packets.
2. Start Wireshark, double-click your active interface (Wi-Fi or Ethernet) to begin capturing, load one web page in a browser, then stop the capture after about ten seconds.
3. In the filter bar type `dns` and press Enter. Find the query for the site you visited and the response below it. Note the transport protocol (usually UDP) and the port (53).
4. Clear the filter and type `tcp.flags.syn == 1 && tcp.flags.ack == 0`. These are the opening packets of TCP handshakes. Pick one and note the destination port; 443 means HTTPS.
5. Click that packet. In the middle pane expand each section: Frame, Ethernet II, Internet Protocol, Transmission Control Protocol. Write down which OSI layer each belongs to and which addresses it contains (MAC, IP, port).
6. Without Wireshark, run `ping -n 4 example.com` (Windows) or `ping -c 4 example.com` (Linux/macOS) and list the layers the request passes through before it leaves your machine.

## Check yourself

1. **Which layer uses port numbers, and what are its two main protocols?**
   Layer 4, transport. TCP (reliable, connection-oriented) and UDP (best effort, connectionless).
2. **A switch forwards a frame based on which address?**
   The destination MAC address, a Layer 2 address.
3. **What is the PDU called at Layer 3?**
   A packet. Frames are Layer 2, segments and datagrams are Layer 4, bits are Layer 1.
4. **Your laptop can ping 1.1.1.1 but cannot open any website by name. Which layer and service do you check first?**
   Application-layer name resolution, DNS. Layers 1 through 3 work because the ping to an IP address succeeded.
5. **Which TCP/IP layer corresponds to OSI Layers 1 and 2?**
   The link layer, sometimes called network access.
