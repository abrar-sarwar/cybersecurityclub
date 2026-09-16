---
title: VMware Workstation Pro and Fusion
summary: Broadcom's desktop hypervisors for Windows, Linux and Mac. Fast and polished with excellent snapshots; free for personal use, but downloads require a Broadcom account.
lastReviewed: 2026-09-15
status: published
references:
  - title: Broadcom support portal
    url: https://support.broadcom.com/
    note: Register, then find Workstation Pro and Fusion under the VMware Cloud Foundation division. The layout changes; verify.
  - title: VMware Fusion and Workstation product page
    url: https://www.vmware.com/products/desktop-hypervisor/workstation-and-fusion
  - title: Kali Linux, import the pre-made VMware VM
    url: https://www.kali.org/docs/virtualization/import-premade-vmware/
  - title: Kali Linux virtualization documentation
    url: https://www.kali.org/docs/virtualization/
  - title: Kali Linux downloads
    url: https://www.kali.org/get-kali/
---

Workstation Pro (Windows and Linux) and Fusion (Mac) are Broadcom's desktop hypervisors. They are fast, polished and reliable, with good snapshot and networking tools. In 2024 they became free for personal use and later free for everyone; what changed is the process: you need a Broadcom support account, and the download pages are reorganized regularly. If you already use VirtualBox or UTM happily, there is no need to switch. If you want the smoothest experience, especially on an Apple Silicon Mac, Fusion is worth the extra clicks.

> **Note:** Workstation Pro is for 64-bit Windows and Linux hosts; Fusion is for Intel and Apple Silicon Macs. On Apple Silicon, Fusion runs only arm64 guests, so use the arm64 Kali installer and Ubuntu Server for ARM, not the pre-built x64 VMs. We could not verify support for Windows-on-Arm laptops; check Broadcom's compatibility notes before assuming Workstation will install there.

## Installation

1. Create a Broadcom account. Go to the Broadcom support portal, click Register, use an email you control, and complete the profile (some downloads are blocked until address fields are filled in). Verify the email and sign in.
2. Find the download. In the portal, choose the VMware Cloud Foundation division, open My Downloads, and look for the free software section that lists VMware Workstation Pro and VMware Fusion. Pick the current release, accept the terms and download the installer for your platform. The layout moves; if you get lost, search the portal's knowledge base for "Workstation Pro download" or "Fusion download" and verify that you are on a broadcom.com page.
3. **Windows**: run the installer as administrator. If Hyper-V, WSL 2 or Memory integrity are enabled, Workstation offers to use the Windows Hypervisor Platform, which works but is slower; the alternative is to turn those features off as described in the VirtualBox guide. Reboot when asked.
4. **Linux**: make the .bundle file executable with `chmod +x` and run it with `sudo`. The first launch builds the `vmmon` and `vmnet` kernel modules, so install `build-essential` and the headers for your kernel first. With Secure Boot enabled you must sign the modules or disable Secure Boot; Broadcom documents the signing steps.
5. **Mac**: open the .dmg and double-click the installer. Approve the permission prompts (Accessibility and, on Intel Macs with older releases, a system extension under Privacy & Security). Fusion needs a recent macOS; the download page lists the minimum.
6. Get guest images. On x64 hosts, download the Kali pre-built VMware VM from the Kali downloads page and the Ubuntu Desktop ISO. On Apple Silicon, download the Kali arm64 installer ISO and Ubuntu Server for ARM.
7. Kali (x64): extract the .7z archive and open the `.vmx` file with File, Open. Log in as `kali` / `kali` and change the password with `passwd`. Kali (arm64) and Ubuntu: choose File, New, select the ISO, and let the installer run; Workstation and Fusion offer an Easy Install for Ubuntu that fills in the answers for you.
8. Inside each Linux guest run `sudo apt update && sudo apt install -y open-vm-tools-desktop` so the screen resizes, the clipboard works and time stays in sync. Reboot.

## Resource allocation

The same budget as VirtualBox applies: keep at least 3 GB for the host and never assign more virtual processors than the host has physical cores.

| Host RAM | Kali VM | Ubuntu target | Run together? |
| --- | --- | --- | --- |
| 8 GB | 2 vCPU, 3 GB | 2 vCPU, 2 GB | One at a time |
| 16 GB | 2 vCPU, 4 GB | 2 vCPU, 4 GB | Yes |
| 32 GB | 4 vCPU, 8 GB | 2 vCPU, 4 GB | Yes |

Create disks as single, growable files of 30 GB for Kali and 20 GB for Ubuntu; they only occupy what the guest writes. Leave 3D acceleration on for Linux desktops if it works, and turn it off if the display glitches. Workstation may warn that a VM is "configured with side channel mitigations which reduce performance"; on a lab machine that is fine to leave as it is.

## Network isolation

VMware uses named virtual networks:

- **NAT** (VMnet8 on Workstation, "Share with my Mac" on Fusion): the VM reaches the internet through the host; nothing on the network can reach it. Use it for updates.
- **Host-only** (VMnet1, "Private to my Mac"): a private network between the host and the VMs. No internet. Lab traffic goes here.
- **Bridged** (VMnet0, "Autodetect" or a named interface): the VM joins the physical network directly.
- **LAN segments** (Workstation Pro) and custom networks (Fusion, Settings, Network): VM-only networks that do not include the host, the strictest choice for a vulnerable target.

Give Kali two adapters, one NAT and one host-only, and disconnect the NAT adapter in the VM's settings when you are not updating. Give the Ubuntu target only host-only, or a LAN segment if you want it completely unreachable from the host. On Windows, Edit, Virtual Network Editor (run as administrator) shows the DHCP ranges; on Fusion, Settings, Network does the same.

> **Careful:** Never use Bridged on campus Wi-Fi or a shared home network. Bridged puts your Kali box and any vulnerable VM directly on the network, where they are a risk to others and a policy violation waiting to happen.

## Snapshots and recovery

Snapshots are one of VMware's strengths. In Workstation choose VM, Snapshot, Take Snapshot, name it, and add a note. The Snapshot Manager (VM, Snapshot, Snapshot Manager) shows the tree; select a snapshot and click Go To to restore it. In Fusion the same lives under Virtual Machine, Snapshots, with Take Snapshot and Restore Snapshot. Both products can snapshot a running VM, memory included, which is useful for saving a half-finished exercise. AutoProtect can take snapshots on a schedule, but manual ones with meaningful names are easier to reason about.

Snapshots are stored as delta files in the VM's folder and grow over time; keep a small number and delete old ones (deleting merges, it does not discard the current state). For a real backup, shut the VM down and copy its whole folder to another drive, or use VM, Manage, Clone to make a full clone.

## Common errors

- **"VMware Workstation and Device/Credential Guard are not compatible" or "Virtualized Intel VT-x/EPT is not supported on this platform"**: Hyper-V or virtualization-based security is on. Either let Workstation use the Windows Hypervisor Platform (slower) or disable Hyper-V, Memory integrity and Virtual Machine Platform, run `bcdedit /set hypervisorlaunchtype off`, and reboot.
- **"This host supports Intel VT-x, but VT-x is disabled"**: turn virtualization on in the UEFI/BIOS setup.
- **Cannot find the download, or "You do not have access"**: make sure you are in the VMware Cloud Foundation division of the portal, your profile is complete, and you are looking in the free software section. The portal changes; Broadcom's knowledge base has the current path.
- **Apple Silicon: the installer says the operating system could not be found, or the VM will not boot**: the image is x64. Download the arm64 version.
- **Linux: "Unable to start services", or the modules fail to build**: install the kernel headers and try again; if your kernel is newer than the Workstation release supports, use your distribution's LTS kernel or wait for an update. With Secure Boot on, sign the modules.
- **Mac: "Could not open /dev/vmmon: Broken pipe"**: allow the VMware system extension in System Settings, Privacy & Security, and reboot (Intel Macs with older Fusion releases).
- **Slow VMs**: the same causes as VirtualBox: Hyper-V in the way, too many vCPUs, antivirus scanning the VM folder, or running on battery.

## First exercise

1. Boot Kali with the NAT adapter connected, log in and run `sudo apt update && sudo apt full-upgrade -y`.
2. Run `whoami` and `ip a`; note the host-only address (Workstation picks a `192.168.x.0/24` range at install time; the Virtual Network Editor shows which).
3. Boot Ubuntu, run `ip a`, and ping between the two VMs. Disconnect Kali's NAT adapter and confirm `ping -c 3 1.1.1.1` fails.
4. Take a snapshot of each VM named `baseline`.
5. Break something harmless in Kali: `sudo mv /usr/bin/ls /usr/bin/ls.bak`, then watch `ls` fail.
6. Restore `baseline` from the Snapshot Manager and confirm `ls` works again.

## Success check

- Both VMs boot and you sign in with your own password.
- The two VMs ping each other over host-only addresses, and Kali has no internet while NAT is disconnected.
- Each VM has a `baseline` snapshot and you have restored one successfully.
- The clipboard and screen resizing work, which proves open-vm-tools is installed.
- Your Broadcom login works and you know where the download page is for the next update.

## Cleanup

In Workstation, right-click the VM and choose Manage, Delete from Disk; in Fusion, choose Delete from the Virtual Machine Library and pick Move to Trash. Both remove the disks and snapshots. Delete the ISO and .7z files. Uninstall via Apps on Windows, `sudo vmware-installer -u vmware-workstation` on Linux, or by dragging Fusion to the Trash on a Mac. If you want to close the Broadcom account, use the profile settings on the support portal or contact Broadcom support; there is no harm in keeping it for future downloads.
