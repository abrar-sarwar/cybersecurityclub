---
title: Cloud and virtual networking basics
objective: Explain cloud service and deployment models, describe how a virtual private cloud is built from subnets, gateways and security groups, and recognize what SDN, VXLAN, SD-WAN and zero trust each solve.
kind: lesson
estimatedMinutes: 45
prerequisites:
  - IP addressing and subnetting (this track)
  - Routing fundamentals (this track)
completionChecks:
  - I can define IaaS, PaaS and SaaS and give an example of each.
  - I can draw a VPC with public and private subnets, an internet gateway and a NAT gateway.
  - I can explain the difference between a security group and a network access control list.
  - I can describe the problem that SDN, VXLAN, SD-WAN and zero trust each address.
references:
  - title: NIST SP 800-145, The NIST Definition of Cloud Computing
    url: https://csrc.nist.gov/pubs/sp/800/145/final
  - title: AWS documentation - What is Amazon VPC?
    url: https://docs.aws.amazon.com/vpc/latest/userguide/what-is-amazon-vpc.html
  - title: Microsoft Learn - Azure Virtual Network overview
    url: https://learn.microsoft.com/en-us/azure/virtual-network/virtual-networks-overview
  - title: RFC 7348, Virtual eXtensible Local Area Network (VXLAN)
    url: https://www.rfc-editor.org/rfc/rfc7348
status: published
lastReviewed: 2026-09-15
---

Most networks you will touch as a security student are at least partly virtual: virtual machines on a laptop, containers, or subnets inside a cloud account. Everything from the earlier lessons still applies (addresses, routes, gateways, access lists); the difference is that the cables are software, and a mistake in a console can expose a server to the whole internet in one click. This lesson gives you the vocabulary to read a cloud network diagram and to reason about what is protecting what.

## Cloud service and deployment models

NIST SP 800-145 defines cloud computing by five characteristics: on-demand self-service, broad network access, resource pooling, rapid elasticity and measured service. Two words from that list appear on the exam as a pair: **scalability** is the ability to grow, while **elasticity** is growing and shrinking automatically with demand. **Multitenancy** means many customers share the same physical hardware with logical isolation between them.

Service models describe how much you manage:

- **IaaS** (infrastructure as a service) gives you virtual machines, storage and virtual networks; you manage the operating system and everything above it. Examples: Amazon EC2, Azure Virtual Machines.
- **PaaS** (platform as a service) gives you a runtime or managed service such as a database or an app hosting platform; you manage your code and data.
- **SaaS** (software as a service) gives you a finished application such as email or an office suite; you manage users and settings.

Deployment models describe who the cloud is for: **public** (shared provider infrastructure), **private** (built for one organization), **hybrid** (a mix, connected together) and **community** (shared by organizations with common needs). Under every model a **shared responsibility** split applies: the provider secures the physical facilities and the underlying platform; you secure your configuration, identities, network rules and data.

## Anatomy of a virtual private cloud

A **VPC** (AWS and others) or **virtual network** (Azure) is an isolated network inside a provider's cloud with an address block you choose, such as 10.20.0.0/16. Inside it you create:

- **Subnets**, each a slice of the block, often placed in different availability zones. A subnet is **public** if its route table sends 0.0.0.0/0 to an **internet gateway** and its resources have public addresses; otherwise it is **private**.
- **Route tables**, one per subnet, that behave exactly like the routing tables in the routing lesson.
- A **NAT gateway** in a public subnet, so that private-subnet servers can download updates and reach APIs without accepting inbound connections. It is PAT, delivered as a service.
- **Security groups**, which are stateful firewalls attached to a virtual machine or its network interface. They hold allow rules only, deny everything else inbound by default, and automatically allow the return half of any permitted connection.
- **Network access control lists** (AWS) or **security lists** (other providers): subnet-level filters evaluated as numbered allow and deny rules. In AWS they are stateless, so return traffic needs its own rule covering the ephemeral port range. Azure's network security groups are stateful, so read each provider's documentation before assuming.

Connectivity back to your own network comes in two forms: a **site-to-site VPN** over the internet using IPsec, or a dedicated private circuit (AWS Direct Connect, Azure ExpressRoute) for predictable bandwidth and latency. Individual users connect with a client VPN or, increasingly, through a zero trust access broker.

> **Tip:** When a cloud exam question describes a rule that "allows the reply automatically," it is talking about a stateful security group. When it describes "rule numbers evaluated in order" or "explicit deny," it is talking about a network ACL.

## Virtualization underneath

A **hypervisor** runs virtual machines. Type 1 hypervisors run on bare metal (ESXi, Hyper-V, KVM) and power clouds and data centers; type 2 hypervisors run as an application on your laptop (VirtualBox, VMware Workstation) and power the club's home lab guides. Each VM has a virtual NIC connected to a **virtual switch**, and the switch decides whether the VM is bridged onto your real LAN, hidden behind NAT on the host, or isolated on a host-only network. Those three modes are miniature versions of public subnet, private subnet behind a NAT gateway, and isolated subnet.

**Network function virtualization (NFV)** runs firewalls, routers and load balancers as software appliances instead of hardware. **VXLAN** (RFC 7348) carries Layer 2 frames inside UDP packets (port 4789) across a routed network, using a 24-bit identifier that allows about 16 million segments instead of the 4094 VLAN limit. This lets a virtual machine keep its subnet while it moves between racks or data centers.

**Software-defined networking (SDN)** separates the control plane (deciding where traffic goes) from the data plane (forwarding it). A central controller programs many switches through a southbound API and exposes a northbound API to applications, so the network can be changed by code. **SD-WAN** applies the same idea to branch offices, steering traffic across broadband, cellular and private links according to policy and application. **Infrastructure as code** tools describe whole networks in versioned text files so environments can be rebuilt identically.

## Zero trust, SASE and SSE

Traditional designs trusted anything inside the perimeter. **Zero trust** (NIST SP 800-207) removes that assumption: every request is authenticated and authorized based on identity, device health and context, regardless of where it comes from, with least privilege and small segments (microsegmentation) so that one compromised host cannot roam. **SASE** (secure access service edge) packages SD-WAN with cloud-delivered security services such as secure web gateways, cloud access security brokers, zero trust network access and firewall as a service; **SSE** is that security bundle without the SD-WAN part.

## Guided practice

This exercise is paper first. You do not need a cloud account, and if you do use a free tier later, set a billing alarm before creating anything and delete resources when you finish.

1. Draw a VPC with the block 10.20.0.0/16. Add a public subnet 10.20.1.0/24 and a private subnet 10.20.2.0/24. Add an internet gateway, and write the route table for each subnet.
2. Place a NAT gateway in the public subnet and add the private subnet's default route through it. Put a web server in the public subnet and a database server in the private subnet.
3. Write security group rules: the web server accepts 443 from anywhere and 22 only from your home address; the database accepts its port only from the web server's security group. Then write the equivalent network ACL for the private subnet, including the return-traffic rule that a stateless list needs.
4. Trace a browser request from your laptop to the web server and the web server's query to the database. At each step name the control that inspects the traffic.
5. If you use VirtualBox or VMware for the club lab, open one VM's network settings, identify the mode (NAT, bridged or host-only) and explain which cloud construct it resembles. Then read the AWS and Azure overview pages in the references and match their vocabulary to your drawing.

## Check yourself

1. **You rent a virtual machine and install your own operating system and software. Which service model is this?**
   IaaS. PaaS would give you a managed platform; SaaS would give you the finished application.
2. **Which is stateful, a security group or an AWS network ACL?**
   The security group. The network ACL is stateless and needs explicit rules for return traffic.
3. **Servers in a private subnet need to download patches but must not accept connections from the internet. What do you add?**
   A NAT gateway in a public subnet, with the private subnet's default route pointing to it.
4. **What does VXLAN offer that VLANs do not?**
   About 16 million segment identifiers, and Layer 2 reachability carried over a routed Layer 3 network.
5. **State the central idea of zero trust in one sentence.**
   No request is trusted because of where it comes from; every access is verified against identity, device and context, and granted with least privilege.
