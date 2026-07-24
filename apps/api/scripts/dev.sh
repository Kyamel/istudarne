#!/usr/bin/env sh
# Cloudflare's prebuilt `workerd` looks for the system CA bundle at a fixed path.
# On NixOS the roots live under /nix/store and SSL_CERT_FILE is usually unset, so
# `wrangler dev` fails TLS to Neon with "unable to get local issuer certificate".
# Point workerd's BoringSSL at the system bundle when one exists and the caller
# hasn't set it. No-op on Debian/Ubuntu (same path) and macOS (file absent).
ca=/etc/ssl/certs/ca-certificates.crt
if [ -z "$SSL_CERT_FILE" ] && [ -f "$ca" ]; then
	export SSL_CERT_FILE="$ca"
fi

# Self-host the Scalar bundle into public/assets before serving.
node "$(dirname "$0")/copy-scalar.mjs"

export WRANGLER_LOG_PATH=.wrangler/logs
exec wrangler dev --port 8787 "$@"
