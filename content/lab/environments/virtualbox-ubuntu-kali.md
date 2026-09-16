---
title: VirtualBox with Ubuntu and Kali Linux
summary: Free virtual machines on Windows, Linux and Intel Macs. One Ubuntu desktop to learn on, one Kali VM for tools, both on a private host-only network.
lastReviewed: 2026-09-15
status: published
references:
  - title: VirtualBox downloads
    url: https://www.virtualbox.org/wiki/Downloads
  - title: VirtualBox user manual, chapter 6 (Virtual Networking)
    url: https://www.virtualbox.org/manual/ch06.html
  - title: VirtualBox documentation index
    url: https://www.virtualbox.org/wiki/Documentation
  - title: Kali Linux, import the pre-made VirtualBox VM
    url: https://www.kali.org/docs/virtualization/import-premade-virtualbox/
  - title: Kali Linux downloads
    url: https://www.kali.org/get-kali/
  - title: Ubuntu Desktop download
    url: https://ubuntu.com/download/desktop
---

VirtualBox is the most common first home lab because it is free, runs on Windows, Linux and Intel Macs, and the Kali team publishes a ready-made image for it. This guide builds two machines: a Kali VM that holds your tools and a small Ubuntu VM you can practice on. Both live on a private network that only your computer can see.

> **Note:** VirtualBox needs an x64 processor with hardware virtualization. On an Apple Silicon Mac use the UTM guide instead; VirtualBox's Apple Silicon build only runs arm64 guests, and the pre-built Kali image will not boot on it.

## Installation

### Every platform

1. Confirm that hardware virtualization (Intel VT-x or AMD-V) is on. On Windows, open Task Manager, choose the Performance tab and look for "Virtualization: Enabled". On Linux, run `grep -Ec '(vmx|svm)' /proc/cpuinfo`; a number above zero means the CPU supports it, though it can still be disabled in firmware.
2. If it is disabled, reboot into the UEFI/BIOS setup (usually Del, F2, F10 or Esc during startup; your laptop maker documents the key), find the option named Intel Virtualization Technology, VT-x, AMD-V or SVM Mode, enable it, save and restart.
3. Make sure you have at least 40 GB free and are on mains power. Downloads total roughly 10 GB.

### Windows 10 and 11

4. Decide what to do about Hyper-V. Hyper-V, Windows Sandbox, WSL 2, Docker Desktop and the "Memory integrity" (core isolation) setting all use Microsoft's hypervisor. VirtualBox 7 can run alongside it through the Windows Hypervisor Platform, but VMs are noticeably slower and show a green turtle icon in the status bar. If you do not need those features on this machine, turn them off: open "Turn Windows features on or off" and untick Hyper-V, Virtual Machine Platform, Windows Hypervisor Platform and Windows Sandbox; in Windows Security open Device security, Core isolation details, and switch Memory integrity off; then run `bcdedit /set hypervisorlaunchtype off` in an administrator terminal and reboot. To undo this later, run `bcdedit /set hypervisorlaunchtype auto`.

> **Careful:** Turning off Memory integrity removes a real protection from your everyday Windows machine, and turning off Virtual Machine Platform breaks WSL 2 and Docker Desktop. If this is your only computer, consider leaving Hyper-V on and accepting slower VMs, or using WSL 2 for tools and a browser lab for targets.

5. Download the Windows installer from the VirtualBox downloads page and run it. Approve the administrator prompt and the warning that network interfaces will be reset briefly. If the installer complains about a missing Microsoft Visual C++ redistributable, install that from Microsoft first and run the VirtualBox installer again.
6. Skip the Extension Pack for now. It is a separate download under a different license, and this lab does not need it.

### Linux

7. Install your distribution's package (`sudo apt install virtualbox` on Ubuntu or Debian) or the .deb, .rpm or Oracle repository from the downloads page. The kernel modules are built on first launch. If Secure Boot is on, the modules must be signed: either the package walks you through enrolling a key with `mokutil`, or you disable Secure Boot in firmware. Add yourself to the `vboxusers` group if you plan to pass USB devices to VMs.

### Intel Mac

8. Open the macOS Intel hosts .dmg and run the installer. If macOS reports that system software from Oracle was blocked, open System Settings, Privacy & Security, click Allow, then run the installer again. Newer builds may not ask; follow whatever the installer says.

### Create the machines

9. Kali: on the Kali downloads page open Pre-built Virtual Machines and download the VirtualBox 64-bit image. Extract the .7z archive (7-Zip on Windows, the built-in Archive Utility on macOS, `7z x` on Linux) and double-click the .vbox file, or use Machine, Add in VirtualBox. Start it, log in as `kali` with password `kali`, then run `passwd` immediately and choose your own.
10. Ubuntu: download the Desktop ISO, click New in VirtualBox, name it `ubuntu-lab`, select the ISO and let the unattended install create a user for you. Choose 2 CPUs, memory from the table below and a 25 GB dynamically allocated disk. After the first boot, run `sudo apt install build-essential dkms`, then choose Devices, Insert Guest Additions CD image and follow the prompts so the screen resizes and the clipboard works.

## Resource allocation

VirtualBox only uses what a running VM is using, so allocation is about how much you can hand over while the host stays usable. Never give VMs more vCPUs than the host has physical cores, and keep at least 3 GB of RAM for the host.

| Host RAM | Kali VM | Ubuntu VM | Run together? |
| --- | --- | --- | --- |
| 8 GB | 2 vCPU, 3 GB | 2 vCPU, 2 GB | One at a time is smoother |
| 16 GB | 2 vCPU, 4 GB | 2 vCPU, 4 GB | Yes |
| 32 GB | 4 vCPU, 8 GB | 2 vCPU, 4 GB | Yes, with room for a third target |

On an 8 GB laptop you will get more done by running Kali alone at 4 GB and starting the Ubuntu VM only when you need a target. The Ubuntu desktop wants around 4 GB to feel normal; if it crawls at 2 GB, install Ubuntu Server instead, which is happy with 1 GB and makes a perfectly good practice target.

Give each VM 128 MB of video memory, the VMSVGA graphics controller and no 3D acceleration. Disks are dynamically allocated, so a 25 GB disk starts small and grows as you use it; the 40 GB requirement covers the point where both VMs are full of tools and snapshots.

## Network isolation

VirtualBox attaches each VM's network adapter in one of several modes, and the mode decides who can reach your machines:

- **NAT** (the default): the VM reaches the internet through the host, nothing on the network can reach the VM, and VMs cannot see each other. Good for updates.
- **NAT Network**: like NAT, but VMs on the same NAT network can also talk to each other.
- **Host-only**: a private network shared by the host and the VMs. No internet. This is where lab traffic belongs.
- **Internal**: VMs only, not even the host. The strictest choice for a deliberately vulnerable target.
- **Bridged**: the VM appears on the physical network as its own device and gets an address from the campus or home router.

Set it up like this. Open File, Tools, Network Manager and make sure a host-only network exists (`vboxnet0` on Linux and macOS, "VirtualBox Host-Only Ethernet Adapter" on Windows) with its DHCP server enabled. In each VM's settings, give Adapter 1 that host-only network. Give Kali a second adapter set to NAT and tick "Cable connected" only while you update; untick it before you start an exercise. The Ubuntu target keeps host-only only, and if you ever import an intentionally vulnerable appliance such as Metasploitable, use Internal networking so even the host is out of reach.

> **Careful:** Never use Bridged on campus Wi-Fi or any shared network. A bridged Kali box looks like a hostile device to the campus network team, a bridged vulnerable VM is an open door for everyone in the building, and both can violate the university's acceptable use rules. A shared home network deserves the same care.

## Snapshots and recovery

A snapshot freezes the VM's disk and, if it is running, its memory, so you can return to that exact moment. Take one right after installation and before anything risky.

To take one, select the VM, open the Snapshots tool from the machine's menu (the list icon next to the VM name), click Take and give it a name that says what state it captures, such as `clean-install-2026-09-15`. Machine, Take Snapshot from inside a running VM does the same. To go back, power the VM off, select the snapshot and click Restore; VirtualBox offers to snapshot the current state first, which is worth accepting if you might want it later.

Snapshots are differencing disks stored next to the VM. Each one grows as you change things, and a long chain slows the VM down, so keep two or three meaningful ones and delete the rest (deleting merges changes forward; it does not lose the current state). Snapshots are not backups: they sit on the same drive as the VM. For a real backup use File, Export Appliance to write an .ova file to an external disk.

## Common errors

- **"VT-x is not available (VERR_VMX_NO_VMX)" or "AMD-V is disabled in the BIOS (VERR_SVM_DISABLED)"**: virtualization is off in firmware, or on Windows another hypervisor holds it. Enable it (step 2) and review the Hyper-V notes (step 4).
- **"Call to WHvSetupPartition failed ... (VERR_NEM_VM_CREATE_FAILED)"**: the Windows Hypervisor Platform is half-configured. Either install the Windows Hypervisor Platform feature so VirtualBox can use Hyper-V properly, or remove all the Hyper-V features and run `bcdedit /set hypervisorlaunchtype off`, then reboot. Mixing the two produces this error.
- **Black screen, or a VM stuck after "Starting"**: switch the graphics controller between VMSVGA and VBoxVGA, turn off 3D acceleration, give the VM 128 MB of video memory, and check that "Enable EFI" matches what the image expects (the pre-built Kali VM comes correctly configured). On Windows, a turtle icon means Hyper-V is in the way.
- **Guest Additions do not build, the clipboard does not work, or the screen will not resize**: install `build-essential dkms linux-headers-$(uname -r)` inside the guest, then insert the Guest Additions CD again. On Kali, `sudo apt update && sudo apt install -y virtualbox-guest-x11` and a reboot is the supported route.
- **The VM aborts or refuses to start because the host disk is full**: dynamic disks and snapshots keep growing. Free host space, delete old snapshots, or use Machine, Move to put the VM on a drive with room.
- **Everything is slow**: check for the turtle icon, reduce vCPUs to 2, exclude the VirtualBox VMs folder from your antivirus scanner, plug in the laptop, and make sure the VM lives on an SSD.
- **Linux host: "Kernel driver not installed (rc=-1908)"**: the modules were not built or signed. Run `sudo /sbin/vboxconfig` and, with Secure Boot on, finish the key enrollment on reboot.

## First exercise

1. Start Kali with the NAT adapter connected, log in, and run `sudo apt update && sudo apt full-upgrade -y`. The first run takes a while.
2. Run `whoami`, `hostname` and `ip a`. Note the address on the host-only adapter, typically in `192.168.56.0/24`.
3. Start the Ubuntu VM, open a terminal and run `ip a` there too. From Kali, `ping -c 3 <ubuntu-address>` should succeed. Disconnect Kali's NAT adapter and confirm `ping -c 3 1.1.1.1` fails; that failure proves the isolation works.
4. Shut both VMs down and take a snapshot of each named `baseline`.
5. Break something harmless in Kali: `sudo mv /usr/bin/ls /usr/bin/ls.bak`, then run `ls` and watch it fail with "command not found".
6. Power off, restore the `baseline` snapshot, start Kali again and run `ls`. It works, and the change you made is gone.

## Success check

You are done when all of these are true:

- Both VMs boot to a login screen and you sign in with your own password, not the default.
- `ip a` in each VM shows a host-only address, and the two VMs can ping each other.
- With the NAT adapter disconnected, Kali cannot reach the internet; with it connected, `apt update` works.
- Each VM has a snapshot named `baseline`, and you restored one and saw the broken `ls` command come back.
- Your host still has at least 10 GB free after everything is installed.

## Cleanup

To remove a VM, right-click it in VirtualBox, choose Remove, then Delete all files; this deletes the disk images and snapshots too. Delete the downloaded ISO and .7z files, which are the largest leftovers. If you no longer need the host-only network, remove it in Network Manager. To uninstall VirtualBox itself, use Apps on Windows, `sudo apt remove virtualbox` on Linux, or run `VirtualBox_Uninstall.tool` from the .dmg on macOS. Finally, if you turned off Hyper-V, Virtual Machine Platform or Memory integrity for this lab, turn them back on.
