---
title: UTM on an Apple Silicon Mac
summary: Free, open-source virtual machines on M-series Macs. Runs arm64 Kali and Ubuntu guests at near-native speed with private networking for lab traffic.
lastReviewed: 2026-09-15
status: published
references:
  - title: UTM for Mac
    url: https://mac.getutm.app/
  - title: UTM documentation
    url: https://docs.getutm.app/
  - title: UTM guide, installing Kali Linux
    url: https://docs.getutm.app/guides/kali/
    note: Written for an older Kali release; the steps still apply.
  - title: UTM guide, installing Ubuntu
    url: https://docs.getutm.app/guides/ubuntu/
  - title: Kali Linux downloads (installer images)
    url: https://www.kali.org/get-kali/
  - title: Ubuntu Server for ARM
    url: https://ubuntu.com/download/server/arm
---

UTM is a free, open-source front end for QEMU and Apple's Virtualization framework. On an M-series Mac it runs arm64 Linux guests at close to native speed, which makes it the best free option for club members with Apple Silicon laptops. The catch is architecture: everything you download must be built for arm64. The pre-built Kali VMs and the standard Ubuntu desktop ISO are x64 and will not boot.

## Installation

1. Confirm your chip: Apple menu, About This Mac. "Chip: Apple M1/M2/M3/M4" means this guide is for you. "Processor: Intel" means use the VirtualBox guide instead.
2. Update macOS if you are more than a version or two behind. UTM's networking modes depend on macOS features, and the download page lists the minimum version it supports.
3. Download UTM from mac.getutm.app. The direct download is free; the Mac App Store listing is the same app sold for a small price to support the project and get automatic updates. Open the .dmg and drag UTM to Applications. The first launch may ask you to confirm that you want to open an app downloaded from the internet.
4. Download the guests. For Kali, open the Kali downloads page, choose Installer Images and pick the Apple Silicon (arm64) installer ISO. Do not use the Pre-built Virtual Machines section (x64) or the ARM section (single-board computers). For Ubuntu, download Ubuntu Server for ARM; you can add a desktop later with `sudo apt install ubuntu-desktop-minimal` if you want one.
5. Create the Kali VM: click the plus button, choose Virtualize (Emulate is for other architectures and is very slow), then Linux. Leave "Use Apple Virtualization" unticked so you get the QEMU backend, which offers more network modes. Pick the Kali ISO as the boot image, set memory and cores from the table below, set storage to 30 GB, skip the shared directory, name it `kali-lab` and save.
6. Start the VM and run through the graphical installer with the defaults; it takes 15-30 minutes. When it finishes and reboots you will see the installer again, because the ISO is still attached: stop the VM, click the CD/DVD control in the VM's toolbar, choose Clear, and start it again.
7. Log in, then install the guest tools that make the clipboard and screen resizing work: `sudo apt update && sudo apt install -y spice-vdagent qemu-guest-agent`, then reboot.
8. Repeat steps 5-7 for Ubuntu Server with 2 GB of memory and a 15 GB disk. The text installer is quick; create a user you will remember.

> **Tip:** If a VM's console stays black after the installer finishes, open the VM settings, choose Display, and change the emulated display card to `virtio-ramfb`. This is the single most common UTM fix.

## Resource allocation

Apple Silicon Macs share memory between everything, and macOS itself wants 3-4 GB, so be conservative.

| Mac RAM | Kali VM | Ubuntu target | Run together? |
| --- | --- | --- | --- |
| 8 GB | 4 cores, 3 GB | 2 cores, 1 GB | Only if nothing else is open |
| 16 GB | 4 cores, 4 GB | 2 cores, 2 GB | Yes |
| 24 GB or more | 4 cores, 6 GB | 2 cores, 2 GB | Yes, with room for more targets |

"Cores" here are virtual CPUs; four is plenty and more rarely helps. Disk images are sparse `.qcow2` files inside the VM bundle at `~/Library/Containers/com.utmapp.UTM/Data/Documents`, so a 30 GB disk only occupies what the guest actually writes. Plan on 30 GB free for both VMs plus the two ISOs (about 5 GB).

## Network isolation

With the QEMU backend, each VM has a network device with a mode:

- **Shared Network**: NAT through the Mac. The VM reaches the internet; nothing outside the Mac can reach the VM. Use it for installing and updating.
- **Emulated VLAN**: QEMU's built-in user-mode network. Also NAT-like, with optional port forwarding, and it works even when macOS refuses the other modes.
- **Host Only**: a private network between the Mac and the VMs on it, with no internet. This is where lab traffic belongs.
- **Bridged**: the VM joins the physical network as its own device.

For the lab, add a second network device to Kali set to Host Only and keep the first on Shared Network; disable the Shared device in the VM settings when you are not updating. Give the Ubuntu target one device on Host Only and nothing else. Both VMs get addresses on the same private range and can reach each other, and nothing outside your Mac can see either of them.

> **Careful:** Never choose Bridged on campus Wi-Fi or a shared home network. Your Kali VM would appear as a rogue device and a vulnerable target would be exposed to everyone on the network. If Host Only refuses to start, use Emulated VLAN rather than falling back to Bridged.

## Snapshots and recovery

UTM does not offer a VirtualBox-style snapshot tree in every backend and version, so learn the reliable method: cloning. With the VM stopped, right-click it in the sidebar and choose Clone. The copy is a complete, independent VM; name it `kali-lab-baseline` and leave it untouched. When you break the working copy, delete it and clone the baseline again. Cloning copies the whole disk, so it costs as much space as the guest currently uses.

If your UTM version shows a Snapshots or Save state option, try it on a throwaway VM first and confirm it restores what you expect before relying on it. Experienced users can also install `qemu-img` with Homebrew and take internal snapshots of a stopped VM's `.qcow2` disk, but that is optional. Whatever you use, keep your notes and any files you care about outside the VM, for example in a shared directory or a Git repository.

## Common errors

- **The installer never appears, or "no bootable device"**: you downloaded an x64 image. Check the file name for `arm64` or `aarch64` and download again.
- **Black screen after the install finishes**: change Display to `virtio-ramfb` (see the tip above), or the VM is booting the ISO again and needs the CD/DVD cleared.
- **Every boot lands in the installer**: the ISO is still attached. Stop the VM, clear the CD/DVD drive and start again.
- **Host Only or Bridged fails to start, or the option is missing**: macOS did not grant the network entitlement, or your UTM build does not support it. Update UTM and macOS, or use Emulated VLAN.
- **The VM is painfully slow**: you chose Emulate rather than Virtualize when creating it. Delete and recreate the VM; there is no switch to change it afterwards.
- **Clipboard and resolution never change**: install `spice-vdagent` inside the guest (step 7) and reboot.
- **"Disk full" on the Mac**: clones and grown disk images add up. Delete unused VMs from UTM and empty the Trash; the space is only freed after that.

## First exercise

1. Start Kali with the Shared Network device on, log in and run `sudo apt update && sudo apt full-upgrade -y`.
2. Run `uname -m` (expect `aarch64`), `whoami` and `ip a`, and note the Host Only address.
3. Start the Ubuntu target, run `ip a`, and from Kali run `ping -c 3 <ubuntu-address>`. Then turn off Kali's Shared Network device and confirm `ping -c 3 1.1.1.1` fails.
4. Shut down both VMs and clone each one as a baseline.
5. In the working Kali copy, run `sudo mv /usr/bin/ls /usr/bin/ls.bak` and watch `ls` fail.
6. Delete the working copy, clone the baseline again, boot it and confirm `ls` is back.

## Success check

- `uname -m` prints `aarch64` in both guests, proving you have arm64 images.
- Each guest has a Host Only address and the two can ping each other.
- With Shared Network off, Kali cannot reach the internet; with it on, `apt update` works.
- You have `kali-lab-baseline` and `ubuntu-lab-baseline` clones that you never boot.
- Pasting from macOS into the Kali terminal works.

## Cleanup

Deleting a VM in UTM (right-click, Delete) moves its bundle to the Trash; empty the Trash to reclaim the space, which can be tens of gigabytes. Remove the ISO files from Downloads. To uninstall UTM, drag it from Applications to the Trash and, if you want every trace gone, delete `~/Library/Containers/com.utmapp.UTM`. Nothing else on the Mac was changed by this guide.
