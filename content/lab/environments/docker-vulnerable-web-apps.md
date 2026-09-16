---
title: Docker with vulnerable web apps
summary: Run intentionally vulnerable web applications such as OWASP Juice Shop as containers bound to localhost, for application security practice on any laptop.
lastReviewed: 2026-09-15
status: published
references:
  - title: Docker Desktop
    url: https://www.docker.com/products/docker-desktop/
  - title: Install Docker Desktop on Windows
    url: https://docs.docker.com/desktop/setup/install/windows-install/
  - title: Install Docker Desktop on Mac
    url: https://docs.docker.com/desktop/setup/install/mac-install/
  - title: Install Docker Desktop on Linux
    url: https://docs.docker.com/desktop/setup/install/linux/
  - title: Docker Engine security
    url: https://docs.docker.com/engine/security/
  - title: OWASP Juice Shop
    url: https://owasp.org/www-project-juice-shop/
  - title: OWASP Juice Shop on GitHub (Docker instructions)
    url: https://github.com/juice-shop/juice-shop
  - title: DVWA (Damn Vulnerable Web Application)
    url: https://github.com/digininja/DVWA
  - title: OWASP WebGoat
    url: https://owasp.org/www-project-webgoat/
---

Containers are the quickest way to get an intentionally vulnerable web application running. OWASP Juice Shop starts in seconds, resets by restarting, and runs on any laptop that can run Docker, including Apple Silicon Macs. The trade-off is isolation: a container shares the host's kernel, so it is a packaging and process boundary, not a wall. That is fine for a web app whose only attacker is you, using a browser on the same machine. It is not fine for malware samples, exploit kits or anything designed to fight back; those belong in a VM with snapshots.

> **Careful:** Docker containers are not a strong isolation boundary against hostile code. Use them for vulnerable web apps bound to localhost. Never run unknown binaries, malware or "hackable" images from random registries, and never give a lab container `--privileged` or access to `/var/run/docker.sock`.

## Installation

### Windows 10 and 11

1. Enable virtualization in the UEFI/BIOS if Task Manager's Performance tab shows "Virtualization: Disabled".
2. Install WSL 2 first: open PowerShell as administrator, run `wsl --install`, and reboot. Docker Desktop uses the WSL 2 backend by default.
3. Download Docker Desktop for Windows, choosing the x64 or Arm64 build to match your PC, run the installer, keep "Use WSL 2 instead of Hyper-V" ticked, and sign out and back in when asked.
4. Start Docker Desktop. You can skip creating a Docker account; it is not needed to pull public images. Accept the subscription agreement, which is free for personal and educational use.

### macOS

5. Download the Apple Silicon or Intel build to match your Mac (About This Mac tells you which), open the .dmg, drag Docker to Applications and launch it. Approve any prompt to install a helper. On Apple Silicon, Rosetta is optional and only needed for a few x64-only images.

### Linux

6. Docker Engine from Docker's apt or dnf repository is the lighter choice; follow the install page for your distribution. Docker Desktop for Linux also exists and needs KVM. After installing Engine, run `sudo usermod -aG docker $USER` and log out and in. Membership of the `docker` group is equivalent to root on that machine, which is one more reason to keep this on a machine you control.

### ChromeOS

7. Enable the Linux development environment in Settings, then install Docker Engine inside it following the Debian instructions. This works on many, but not all, Chromebooks and is an advanced route.

### Verify and run Juice Shop

8. In a terminal run `docker version` and `docker run --rm hello-world`. Both should succeed without `sudo` on Windows and macOS.
9. Start Juice Shop bound to localhost only:

```bash
docker pull bkimminich/juice-shop
docker run --rm -p 127.0.0.1:3000:3000 bkimminich/juice-shop
```

10. Open `http://localhost:3000` in your browser. Press Ctrl+C in the terminal to stop the app.

Other well-known targets work the same way: DVWA ships a `docker compose` file that listens on port 4280, and WebGoat publishes an image on Docker Hub. Take the current commands from each project's README and add `127.0.0.1:` in front of the host port every time.

## Resource allocation

Docker Desktop runs a small Linux virtual machine, and containers live inside it. On Windows that VM is WSL 2, which by default may claim up to half of your RAM; create `%UserProfile%\.wslconfig` containing:

```ini
[wsl2]
memory=4GB
processors=2
```

and run `wsl --shutdown` to apply it. On macOS, set the same limits in Docker Desktop under Settings, Resources. Juice Shop itself needs well under 1 GB, so 4 GB and 2 CPUs leave room for two or three targets at once. Disk is the resource that creeps: each image is 0.5-2 GB and the Docker VM's disk file only grows. Keep 20 GB free, run `docker system df` to see what is using space, and `docker system prune` to remove stopped containers and unused images.

## Network isolation

By default, containers sit on a private bridge network behind NAT. They can reach the internet, but nothing reaches them until you publish a port with `-p`. The important detail is the address you publish on: `-p 3000:3000` publishes on every host interface, so anyone on the same Wi-Fi could open your Juice Shop, and on Linux, Docker manages its own firewall rules and can bypass `ufw`. `-p 127.0.0.1:3000:3000` publishes on the loopback interface only, so only your own browser gets in. Do this every time.

For labs with several containers that must talk to each other, create a network with no route to the outside: `docker network create --internal lab`, then start containers with `--network lab`. That keeps a "compromised" target from calling out. Keep your host firewall on, especially on campus Wi-Fi, where the Windows network profile should be Public.

> **Tip:** Confirm the binding with `docker ps`. The PORTS column should read `127.0.0.1:3000->3000/tcp`, not `0.0.0.0:3000->3000/tcp`.

## Snapshots and recovery

Containers are disposable, which replaces snapshots for this kind of lab. `--rm` deletes the container when it stops, so restarting Juice Shop gives you a fresh copy with every challenge unsolved. If you want to keep progress, drop `--rm`, give the container a name with `--name juice`, and use `docker stop juice` and `docker start juice`. DVWA keeps its state in a database volume; `docker compose down -v` wipes it. If an image update changes something you rely on, pin a version tag instead of `latest`.

Recovery for the platform itself is simple too: Docker Desktop's Troubleshoot menu offers "Clean / Purge data" and "Reset to factory defaults", and on Windows `wsl --shutdown` followed by restarting Docker Desktop fixes most stuck states. Keep your notes and any scripts outside the containers.

## Common errors

- **"WSL 2 installation is incomplete" or "Docker Desktop requires a newer WSL kernel"**: run `wsl --update` as administrator, reboot, and make sure the Virtual Machine Platform feature is on.
- **"Hardware assisted virtualization and data execution protection must be enabled in the BIOS"**: enable VT-x or AMD-V in firmware.
- **"port is already allocated" or "bind: address already in use"**: something else is on port 3000. Publish a different host port: `-p 127.0.0.1:3001:3000`.
- **"permission denied while trying to connect to the Docker daemon socket"** (Linux): add yourself to the `docker` group and log in again, or start the service with `sudo systemctl start docker`.
- **"The requested image's platform (linux/amd64) does not match the detected host platform"** (Apple Silicon or Windows on Arm): the image has no arm64 build. Juice Shop ships both; for others add `--platform linux/amd64`, which runs slowly under emulation.
- **"no space left on device"**: run `docker system prune -a --volumes` after checking that you do not need the volumes, and on Windows use Docker Desktop's disk clean-up so the WSL disk file shrinks.
- **Docker Desktop is stuck on "Starting"**: quit it, run `wsl --shutdown`, and start it again; if Hyper-V was recently disabled, re-enable the Virtual Machine Platform feature.

## First exercise

1. Start Juice Shop with the command from step 9 and open it in your browser.
2. In a second terminal run `docker ps` and check that the PORTS column shows `127.0.0.1:3000`.
3. Register an account inside the app with a made-up email and a throwaway password. Then find the hidden score board: it is a page the app does not link to, and discovering it is the first challenge. Do not look it up yet; try the browser's developer tools.
4. Run `docker logs <container-id>` and watch the requests you just made appear.
5. Stop the app with Ctrl+C, start it again, and try to log in. Your account is gone, because the container was disposable. That is the reset button.

## Success check

- `docker run --rm hello-world` prints its success message.
- Juice Shop loads at `http://localhost:3000`, and `docker ps` shows it bound to `127.0.0.1`.
- From another device on the same network, `http://<your-computer-ip>:3000` does not load.
- After a restart, the account you created no longer exists.
- Docker's memory limit is set to 4 GB or less and your machine stays responsive with the app running.

## Cleanup

Stop containers with `docker stop`, remove them with `docker rm`, and remove images with `docker rmi bkimminich/juice-shop`. `docker system prune -a --volumes` clears everything Docker has cached. To uninstall Docker Desktop, use Apps on Windows or drag it to the Trash on macOS (the Docker menu's Troubleshoot page also has an Uninstall button that removes its data). On Windows, `wsl --unregister docker-desktop` removes any leftover WSL distribution. On Linux, remove the `docker-ce` packages and delete `/var/lib/docker` if you want the images gone too.
