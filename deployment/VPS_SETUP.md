# VPS Setup Guide

This guide explains one way to self-host **AGARTHA: FALSE GUIDE** on a Linux VPS with Nginx. The project is a static site, so you can also use static hosting providers instead of a VPS.

## Table of Contents
1.  [Server Requirements](#server-requirements)
2.  [Network Settings](#network-settings)
3.  [Initial Server Setup](#initial-server-setup)
4.  [Deployment Configuration](#deployment-configuration)
5.  [Nginx Configuration](#nginx-configuration)
6.  [Domain & SSL](#domain--ssl)
7.  [Verify Deployment](#verify-deployment)
8.  [Optional GitHub Actions](#optional-github-actions)

---

## Server Requirements

Recommended baseline:

*   Ubuntu 22.04 LTS or newer.
*   1 vCPU and 1 GB RAM or better.
*   SSH access with a private key.
*   A domain name if you want HTTPS through Let's Encrypt.

The game is static, so larger instances are usually unnecessary unless you are serving heavy traffic from the same machine.

---

## Network Settings

Open these inbound ports on your server firewall or cloud security group:

*   **SSH (22)**: Administration.
*   **HTTP (80)**: Initial web traffic and Let's Encrypt validation.
*   **HTTPS (443)**: Secure public traffic.

Avoid opening application-specific ports unless you add a backend service.

---

## Initial Server Setup

Connect to the server from your local machine:

```bash
ssh -i <SSH_KEY_PATH> <SSH_USER>@<YOUR_SERVER_IP_OR_HOSTNAME>
```

Install and start Nginx:

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install nginx -y
sudo systemctl enable nginx
sudo systemctl start nginx
```

---

## Deployment Configuration

From your local project directory:

```bash
cp deployment/deploy.config.example deployment/deploy.config
```

Edit `deployment/deploy.config`:

*   `VPS_HOST`: Your server IP address or hostname.
*   `VPS_USER`: Your SSH user.
*   `SSH_KEY_PATH`: Local path to your private SSH key.
*   `REMOTE_DIR`: Directory Nginx will serve, such as `/var/www/agartha-false-guide`.
*   `PROJECT_NAME`: Name used for the Nginx site file.
*   `DOMAIN`: Public domain for the site.

Run the deployment:

```bash
./deployment/deploy.sh
```

The script uploads runtime files, renders `deployment/nginx.conf` with your config values, validates Nginx, and reloads the service.

---

## Nginx Configuration

`deployment/nginx.conf` is a template. The deploy script replaces:

*   `<YOUR_DOMAIN>`
*   `<REMOTE_DIR>`

If you install it manually, replace those placeholders yourself before copying it into `/etc/nginx/sites-available/`.

---

## Domain & SSL

Point your domain's A record to your server IP address.

Install Certbot on the server:

```bash
sudo apt install python3-certbot-nginx -y
```

Request a certificate:

```bash
sudo certbot --nginx -d <YOUR_DOMAIN> -d www.<YOUR_DOMAIN>
```

Certbot can configure HTTPS and renewal automatically.

---

## Verify Deployment

After `./deployment/deploy.sh` finishes, verify the site from a browser:

```text
https://<YOUR_DOMAIN>
```

Then check the main runtime paths:

*   The main menu loads without a blank screen.
*   Starting a level loads `js/`, `css/`, `assets/portraits/`, and `assets/music/` without missing-file errors.
*   The browser console has no blocked module imports.
*   `https://<YOUR_DOMAIN>/assets/screenshots/main_menu.png` returns the README screenshot if you published screenshots with the site.

If the site fails to load, run these server-side checks:

```bash
sudo nginx -t
sudo systemctl status nginx --no-pager
sudo tail -n 80 /var/log/nginx/error.log
```

If HTTPS fails, confirm DNS points to the VPS and rerun:

```bash
sudo certbot --nginx -d <YOUR_DOMAIN> -d www.<YOUR_DOMAIN>
```

---

## Optional GitHub Actions

An inactive workflow template is available at:

```text
deployment/github-actions-deploy.example.yml
```

To use it, copy it into `.github/workflows/deploy.yml` in your own repository and configure these repository secrets:

*   `VPS_HOST`
*   `VPS_USER`
*   `VPS_SSH_KEY`

Do not commit private keys, tokens, IP-specific config files, or generated deployment config.
