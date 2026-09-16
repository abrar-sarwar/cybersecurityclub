---
title: Wireless networking
objective: Compare Wi-Fi frequency bands, channels and standards, choose the right security mode, and diagnose common wireless problems such as interference and weak coverage.
kind: lesson
estimatedMinutes: 45
prerequisites:
  - The OSI and TCP/IP models (this track)
  - Switching, VLANs and Ethernet (this track)
completionChecks:
  - I can explain the trade-offs between the 2.4 GHz, 5 GHz and 6 GHz bands.
  - I can pick non-overlapping channels and explain what channel width changes.
  - I can compare WPA2 and WPA3, and personal versus enterprise authentication.
  - I can identify interference, coverage and roaming problems from their symptoms.
references:
  - title: Wi-Fi Alliance - Security (WPA3 and Wi-Fi Enhanced Open)
    url: https://www.wi-fi.org/discover-wi-fi/security
  - title: IEEE 802.11 Wireless LAN Working Group
    url: https://www.ieee802.org/11/
  - title: Microsoft Learn - netsh command contexts (includes netsh wlan)
    url: https://learn.microsoft.com/en-us/windows-server/networking/technologies/netsh/netsh-contexts
status: published
lastReviewed: 2026-09-15
---

Wi-Fi is the network most people use most of the time, and it fails in ways wired networks never do: invisible interference, walls, neighbors, and a shared medium where every device waits its turn to talk. The exam covers the physical facts (bands, channels, standards), the design choices (SSIDs, antennas, access point types) and the security modes. All three come together when you troubleshoot.

## Bands, channels and width

Wi-Fi uses three unlicensed bands, and each is a trade-off between reach and capacity.

- **2.4 GHz** travels farthest and passes through walls best, but it is crowded. Microwave ovens, Bluetooth, baby monitors and every neighbor share it, and in North America only three 20 MHz channels do not overlap: 1, 6 and 11. Putting an access point on channel 3 does not find free space; it interferes with both 1 and 6.
- **5 GHz** offers many more non-overlapping channels and less interference, at shorter range. Some of its channels are shared with radar, so access points using them must support dynamic frequency selection (802.11h) and will jump channels if radar is detected.
- **6 GHz**, opened by Wi-Fi 6E and used by Wi-Fi 7, adds a large block of clean spectrum with the shortest range of the three and requires WPA3.

**Channel width** is how much spectrum one channel occupies: 20, 40, 80 or 160 MHz, with 320 MHz possible in Wi-Fi 7. Wider channels carry more data but leave fewer non-overlapping channels and pick up more interference. A common mistake is running 40 MHz on 2.4 GHz in an apartment building, which turns three usable channels into one and a half.

Standards you should recognize: 802.11b and 802.11g (2.4 GHz, up to 11 and 54 Mbps), 802.11a (5 GHz, 54 Mbps), 802.11n (Wi-Fi 4, both bands, MIMO), 802.11ac (Wi-Fi 5, 5 GHz, gigabit-class), 802.11ax (Wi-Fi 6 and 6E, adds OFDMA for efficiency in crowded rooms) and 802.11be (Wi-Fi 7). Regulatory domains differ by country, so allowed channels and transmit power vary; access points are configured with a country code for this reason.

## SSIDs, access points and antennas

The **SSID** is the network name. Each radio in an access point has a **BSSID**, which is simply that radio's MAC address; when several access points broadcast the same SSID so that clients can roam, the shared name is sometimes called the ESSID. Clients decide when to roam, which is why a laptop can stubbornly cling to a distant access point while sitting next to a closer one.

Network types: **infrastructure** mode (clients talk through an access point, the normal case), **ad hoc** (devices talk directly), **mesh** (access points link to each other wirelessly to extend coverage where cabling is impossible) and **point-to-point** (two directional antennas bridging buildings).

Access points are either **autonomous**, each configured on its own, or **lightweight** and managed by a wireless LAN controller or a cloud dashboard that pushes settings, channels and power levels to all of them. Controllers enable features such as **band steering**, which nudges dual-band clients onto 5 GHz.

Antennas shape coverage. An **omnidirectional** antenna radiates in a doughnut around itself and suits an open room; a **directional** antenna (Yagi, patch, parabolic) focuses energy in one direction for hallways, warehouses and building-to-building links. Signal strength is reported as RSSI in dBm, which is negative: around -50 dBm is excellent, -67 dBm is the usual floor for voice and video, and -80 dBm is unreliable. What matters is signal minus noise, the signal-to-noise ratio. A site survey with a heat map, done before installation, is how professionals decide where access points go.

Guest networks deserve their own SSID mapped to their own VLAN, with client isolation so guests cannot see each other and a captive portal if you need acceptance of terms.

## Security modes

- **WEP** is broken and must never be used. **WPA** with TKIP is deprecated.
- **WPA2** uses AES-CCMP encryption. **WPA2-Personal** relies on a pre-shared key (PSK) and a four-way handshake; anyone who captures the handshake can try passphrases offline, so a weak passphrase is a real risk. **WPA2-Enterprise** uses 802.1X: each user authenticates to a RADIUS server with their own credentials or certificate through an EAP method, so there is no shared password to leak.
- **WPA3** improves both. WPA3-Personal replaces the PSK handshake with SAE (Simultaneous Authentication of Equals), which resists offline guessing and gives forward secrecy. Protected management frames are mandatory, which blocks the deauthentication attacks used to knock clients off a network. WPA3-Enterprise adds an optional 192-bit mode. **Wi-Fi Enhanced Open** encrypts traffic on password-free networks such as cafes, without authentication.
- Turn off WPS, change the administrator password, keep firmware current, and use a transition mode only while old clients are being replaced.

Attacks to know: a **rogue access point** is any unauthorized AP on your network; an **evil twin** copies your SSID to lure clients; **deauthentication** floods knock clients offline. Enterprise authentication, WPA3, wireless intrusion detection and user awareness are the mitigations.

> **Note:** Hiding the SSID and filtering MAC addresses are not security controls. Both are trivially bypassed with a free Wi-Fi analyzer, and hidden SSIDs make clients leak the network name wherever they go.

## Troubleshooting wireless

| Symptom | Likely cause | Check |
| --- | --- | --- |
| Strong signal, slow throughput | Co-channel interference or congestion | Channel utilization on a Wi-Fi analyzer; move to 5 GHz, narrow the channel |
| Drops when the microwave or a neighbor's device runs | 2.4 GHz interference | Move the SSID or client to 5 GHz |
| Dead zone in one room | Insufficient coverage | Site survey; add an access point rather than raising power |
| Laptop stays on a far access point | Roaming or band-steering behavior | Adjust minimum RSSI or roaming thresholds |
| One device cannot join, others can | Security mode mismatch, wrong passphrase, client limit | Compare the client's supported modes with the SSID settings |
| Joins the SSID but gets no address | SSID mapped to the wrong VLAN or DHCP scope | Check the VLAN assignment on the access point and switch port |

Tools: a Wi-Fi analyzer app to see channels and signal, a site survey tool for heat maps, and the built-in commands shown below.

## Guided practice

Work only on your own equipment and networks.

1. Windows: run `netsh wlan show interfaces` and record the SSID, BSSID, radio type, channel, signal percentage and receive rate. macOS: hold Option and click the Wi-Fi icon to see the same details. Linux: `nmcli dev wifi list` and `iw dev`.
2. Windows: run `netsh wlan show networks mode=bssid` to list nearby networks. Count how many use channels 1, 6 and 11 versus other 2.4 GHz channels, and note which are on 5 GHz. On other systems, a free Wi-Fi analyzer app gives the same view.
3. Log into your own router's admin page. Confirm the security mode (WPA2 or WPA3), check that WPS is off, and check the 2.4 GHz channel width. Do not change settings on any network you do not own.
4. Walk with a laptop and record the signal level in three places. Identify the weakest and explain, using the antenna and band ideas above, what you would change.
5. On paper, place three access points along a hallway that must run on 2.4 GHz and assign channels so that neighboring access points never share one.

## Check yourself

1. **Which 2.4 GHz channels do not overlap in North America?**
   1, 6 and 11 at 20 MHz width.
2. **What does WPA3-Personal change compared with WPA2-Personal?**
   SAE replaces the pre-shared key handshake, resisting offline dictionary attacks, and protected management frames become mandatory.
3. **What is the difference between an SSID and a BSSID?**
   The SSID is the network name; the BSSID is the MAC address of one access point radio.
4. **Signal is strong but the connection is slow. What is the first thing to check?**
   Channel utilization and interference. Strong signal rules out coverage; congestion or overlap is the likely cause.
5. **Why is hiding the SSID not a security control?**
   The name is still transmitted in probe and association frames and appears instantly in any Wi-Fi analyzer.
