---
title: WSL 2 for Linux command-line practice
summary: Windows Subsystem for Linux gives you a real Ubuntu or Kali shell inside Windows in about ten minutes. Great for tools and scripting, not for hosting vulnerable targets.
lastReviewed: 2026-09-15
status: published
references:
  - title: Install WSL (Microsoft Learn)
    url: https://learn.microsoft.com/windows/wsl/install
  - title: Basic commands for WSL (Microsoft Learn)
    url: https://learn.microsoft.com/windows/wsl/basic-commands
  - title: Advanced settings configuration in WSL (.wslconfig and wsl.conf)
    url: https://learn.microsoft.com/windows/wsl/wsl-config
  - title: Accessing network applications with WSL
    url: https://learn.microsoft.com/windows/wsl/networking
  - title: Kali Linux on WSL
    url: https://www.kali.org/docs/wsl/
---

WSL 2 runs a real Linux kernel in a lightweight virtual machine that Windows manages for you. Ten minutes after starting you have an Ubuntu or Kali shell with `apt`, Python, `ssh` and the other tools the command-line lessons use, and files move between Windows and Linux without fuss. It is the fastest way for Windows users to practice Linux. It is not a lab for vulnerable targets: the distribution runs on the same machine you do your coursework on, there are no snapshots, and anything you run in it can reach any network Windows can reach.

## Installation

1. Check the requirements: Windows 10 version 2004 (build 19041) or later, or any Windows 11, on x64 or Arm64. Virtualization must be enabled in the UEFI/BIOS; Task Manager's Performance tab shows "Virtualization: Enabled" when it is.
2. Open PowerShell as administrator (right-click Start and choose Terminal (Admin) or Windows PowerShell (Admin)) and run:

```powershell
wsl --install
```

This enables the required Windows features and installs the WSL kernel and the Ubuntu distribution. Reboot when asked.

3. After the reboot an Ubuntu window opens and asks for a username and password. This is a Linux account, separate from your Windows login; pick a short name and a password you will remember, because `sudo` will ask for it.
4. Confirm the version: in PowerShell run `wsl -l -v`. The VERSION column must say 2. If it says 1, run `wsl --set-version Ubuntu 2`.
5. Optional: add Kali as a second distribution with `wsl --install -d kali-linux`. The Kali image is minimal on purpose; inside it, run `sudo apt update && sudo apt install -y kali-linux-headless` to get the common command-line tools (several gigabytes, so let it run during a break).
6. Install Windows Terminal from the Microsoft Store if it is not already present; it gives you tabs for PowerShell, Ubuntu and Kali side by side.
7. Keep WSL itself current with `wsl --update`, and update the distribution with `sudo apt update && sudo apt upgrade -y` as you would on any Ubuntu machine.

> **Note:** If `wsl --install` prints the help text instead of installing, WSL is already present; run `wsl --list --online` to see the available distributions and `wsl --install -d Ubuntu` to add one.

## Resource allocation

The WSL 2 virtual machine starts when you open a shell and stops about a minute after you close the last one. By default it may use up to half of your RAM and all of your processors, and it grows a virtual disk (`ext4.vhdx`) in your profile folder that can reach 1 TB on paper. On a 4 GB or 8 GB laptop, cap it so Windows stays usable. Create the file `%UserProfile%\.wslconfig` with:

```ini
[wsl2]
memory=2GB
processors=2
swap=0
```

Use `memory=4GB` on machines with 8 GB or more. Run `wsl --shutdown` in PowerShell to apply the change. Windows 11 also ships a WSL Settings app in the Start menu that edits the same settings with a form.

Disk: Ubuntu takes 1-2 GB, and Kali with `kali-linux-headless` around 5-8 GB. Keep 10 GB free. Store your files in the Linux home directory (`~`), not under `/mnt/c`, because the Windows drive is much slower to access from Linux.

## Network isolation

WSL 2 uses NAT by default. The Linux VM has its own private address behind Windows; programs listening inside Linux are reachable from Windows through `localhost`, but not from other devices on your network. In the other direction there is no isolation at all: Linux can reach everything Windows can reach, including campus Wi-Fi, so the same rules apply as on Windows. Only scan or probe addresses that belong to your own lab VMs or `127.0.0.1`.

Windows 11 offers a "mirrored" networking mode that puts WSL directly on the host's interfaces; leave it off on shared networks. The Hyper-V firewall filters WSL traffic on recent Windows builds and should stay on.

This is why WSL is a tools environment, not a target environment. A vulnerable service inside WSL runs on your everyday laptop, shares its disk and is reachable from Windows; you cannot snapshot it, and you cannot put it on an internal network away from the host. Run tools here, and run targets in a VM with host-only networking or in a container bound to localhost.

## Snapshots and recovery

There are no snapshots, but export and import give you a reset button. To save a known-good state, run in PowerShell:

```powershell
mkdir C:\wsl-backups
wsl --export Ubuntu C:\wsl-backups\ubuntu-clean.tar
```

To restore, either import the archive as a new distribution (`wsl --import ubuntu-restored C:\wsl\ubuntu-restored C:\wsl-backups\ubuntu-clean.tar`) or wipe and reinstall: `wsl --unregister Ubuntu` deletes everything in that distribution instantly, and `wsl --install -d Ubuntu` gives you a clean one in a couple of minutes. Because a reset is so cheap, keep notes, scripts and anything you care about in a Git repository or on the Windows side.

If WSL misbehaves, `wsl --shutdown` restarts the virtual machine and fixes most oddities, including a clock that drifted after the laptop slept.

## Common errors

- **"WslRegisterDistribution failed with error: 0x80370102"**: virtualization is disabled in firmware, or the Virtual Machine Platform feature is off. Enable both and reboot.
- **"Error: 0x80370114 The operation could not be started because a required feature is not installed"**: turn on Virtual Machine Platform in "Turn Windows features on or off", then run `wsl --update`.
- **Installation hangs at 0%**: run `wsl --install --web-download -d Ubuntu` to fetch the distribution directly instead of through the Store.
- **"WSL 2 requires an update to its kernel component"**: run `wsl --update` as administrator.
- **`apt` cannot resolve hostnames, usually on a VPN**: run `wsl --shutdown` and try again; if it persists, create `/etc/wsl.conf` with a `[network]` section containing `generateResolvConf = false`, then write a working `nameserver` line into `/etc/resolv.conf`.
- **The `ext4.vhdx` file has grown huge and does not shrink**: on WSL 2.0 or later run `wsl --manage Ubuntu --set-sparse true`, or set `sparseVhd=true` under `[experimental]` in `.wslconfig` for new distributions.
- **Everything under `/mnt/c` is slow**: expected; move your working files into the Linux filesystem.

## First exercise

1. Open Ubuntu and run `whoami`, `id`, `cat /etc/os-release` and `ip a`. Note the private address on `eth0`.
2. Update: `sudo apt update && sudo apt upgrade -y`.
3. Start a tiny web server in your home directory with `python3 -m http.server 8000`, then open `http://localhost:8000` in a Windows browser. The page loads, which shows how localhost forwarding works. Press Ctrl+C to stop it.
4. Create a marker file: `echo "lab baseline" > ~/marker.txt`. Then export the distribution from PowerShell with the command in the previous section.
5. Break something harmless: `rm ~/marker.txt` and `mv ~/.bashrc ~/.bashrc.bak`. Open a new Ubuntu tab and notice the plain prompt.
6. Recover: import the archive as `ubuntu-restored`, open it with `wsl -d ubuntu-restored`, and confirm that `cat ~/marker.txt` prints "lab baseline" and the prompt is normal. Fix the original with `mv ~/.bashrc.bak ~/.bashrc` or unregister it.

## Success check

- `wsl -l -v` lists your distribution with VERSION 2.
- `ip a` inside Linux shows a private address, and a server started in Linux is reachable from a Windows browser on `localhost`.
- `.wslconfig` exists and Task Manager shows the "Vmmem" or "VmmemWSL" process staying under your limit.
- `C:\wsl-backups\ubuntu-clean.tar` exists and you imported it successfully.
- `sudo apt update` completes without DNS errors.

## Cleanup

`wsl --unregister <distribution>` deletes a distribution and its virtual disk in one step; run it for `ubuntu-restored` once the exercise is over. Delete the archives in `C:\wsl-backups` when you no longer need them. To remove WSL completely, unregister every distribution, uninstall "Windows Subsystem for Linux" from Apps, and untick Virtual Machine Platform in Windows features; leave that feature on if Docker Desktop or another Hyper-V based tool still needs it.
