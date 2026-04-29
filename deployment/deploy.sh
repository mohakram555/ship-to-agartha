#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CONFIG_FILE="$SCRIPT_DIR/deploy.config"
NGINX_TEMPLATE="$SCRIPT_DIR/nginx.conf"

fail() {
    printf 'Error: %s\n' "$1" >&2
    exit 1
}

require_command() {
    command -v "$1" >/dev/null 2>&1 || fail "Missing required command: $1"
}

is_placeholder() {
    local value="${1:-}"
    [[ -z "$value" || "$value" == *"<YOUR_"* ]]
}

shell_quote() {
    printf '%q' "$1"
}

[[ -f "$CONFIG_FILE" ]] || fail "Missing deployment/deploy.config. Copy deployment/deploy.config.example first."

# shellcheck disable=SC1090
source "$CONFIG_FILE"

VPS_HOST="${VPS_HOST:-${VPS_IP:-}}"
VPS_USER="${VPS_USER:-}"
SSH_KEY_PATH="${SSH_KEY_PATH:-}"
REMOTE_DIR="${REMOTE_DIR:-}"
PROJECT_NAME="${PROJECT_NAME:-agartha-false-guide}"
DOMAIN="${DOMAIN:-}"
SSH_KEY_PATH="${SSH_KEY_PATH/#\~/$HOME}"

is_placeholder "$VPS_HOST" && fail "Set VPS_HOST in deployment/deploy.config."
is_placeholder "$VPS_USER" && fail "Set VPS_USER in deployment/deploy.config."
is_placeholder "$SSH_KEY_PATH" && fail "Set SSH_KEY_PATH in deployment/deploy.config."
is_placeholder "$REMOTE_DIR" && fail "Set REMOTE_DIR in deployment/deploy.config."
is_placeholder "$PROJECT_NAME" && fail "Set PROJECT_NAME in deployment/deploy.config."
is_placeholder "$DOMAIN" && fail "Set DOMAIN in deployment/deploy.config."

[[ -f "$SSH_KEY_PATH" ]] || fail "SSH key not found at $SSH_KEY_PATH."
[[ -f "$PROJECT_ROOT/index.html" ]] || fail "Could not locate index.html in $PROJECT_ROOT."
[[ -f "$NGINX_TEMPLATE" ]] || fail "Could not locate deployment/nginx.conf."

require_command ssh
require_command scp
require_command rsync
require_command sed

cd "$PROJECT_ROOT"

SSH_TARGET="${VPS_USER}@${VPS_HOST}"
REMOTE_DIR_Q="$(shell_quote "$REMOTE_DIR")"
VPS_USER_Q="$(shell_quote "$VPS_USER")"
REMOTE_TMP_CONF="/tmp/${PROJECT_NAME}.conf"
REMOTE_SITE_CONF="/etc/nginx/sites-available/${PROJECT_NAME}"
REMOTE_TMP_CONF_Q="$(shell_quote "$REMOTE_TMP_CONF")"
REMOTE_SITE_CONF_Q="$(shell_quote "$REMOTE_SITE_CONF")"
REMOTE_ENABLED_CONF_Q="$(shell_quote "/etc/nginx/sites-enabled/${PROJECT_NAME}")"

printf 'Deploying %s to %s:%s\n' "$PROJECT_NAME" "$SSH_TARGET" "$REMOTE_DIR"

ssh -i "$SSH_KEY_PATH" "$SSH_TARGET" \
    "sudo mkdir -p $REMOTE_DIR_Q && sudo chown $VPS_USER_Q:$VPS_USER_Q $REMOTE_DIR_Q"

rsync -avz --delete -e "ssh -i \"$SSH_KEY_PATH\"" \
    --exclude '.git' \
    --exclude '.github' \
    --exclude '.DS_Store' \
    --exclude '.claude' \
    --exclude '.env' \
    --exclude '.env.*' \
    --exclude 'deployment' \
    --exclude 'node_modules' \
    --exclude 'tests' \
    --exclude 'release.tar.gz' \
    --exclude '*.tar.gz' \
    --exclude '*.tgz' \
    --exclude '*.zip' \
    --exclude '*_screenshot.png' \
    ./ "$SSH_TARGET:$REMOTE_DIR/"

tmp_nginx="$(mktemp)"
trap 'rm -f "$tmp_nginx"' EXIT

sed \
    -e "s#<YOUR_DOMAIN>#$DOMAIN#g" \
    -e "s#<REMOTE_DIR>#$REMOTE_DIR#g" \
    "$NGINX_TEMPLATE" > "$tmp_nginx"

scp -i "$SSH_KEY_PATH" "$tmp_nginx" "$SSH_TARGET:$REMOTE_TMP_CONF"

ssh -i "$SSH_KEY_PATH" "$SSH_TARGET" \
    "sudo mv $REMOTE_TMP_CONF_Q $REMOTE_SITE_CONF_Q && sudo ln -sf $REMOTE_SITE_CONF_Q $REMOTE_ENABLED_CONF_Q && sudo rm -f /etc/nginx/sites-enabled/default && sudo nginx -t && sudo systemctl reload nginx"

printf 'Deployment complete: https://%s\n' "$DOMAIN"
