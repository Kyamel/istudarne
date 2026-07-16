{
  description = "mhentai dev environment (Node 24, pnpm, native addon toolchain)";

  inputs = {
    # Branch ref here; flake.lock pins the exact revision for reproducibility.
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    # Consumed only by ./shell.nix so `nix-shell` keeps working. Pinned via the lock.
    flake-compat = {
      url = "github:edolstra/flake-compat";
      flake = false;
    };
  };

  outputs = { nixpkgs, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
      in
      {
        devShells.default = pkgs.mkShell {
          # Single source of truth for the toolchain. shell.nix re-exports this.
          packages = with pkgs; [
            nodejs_24 # matches the repo's Node 24 / @types/node
            pnpm # package manager (repo pins pnpm@11 via the packageManager field)

            # Toolchain for native addons compiled from source (better-sqlite3, etc.).
            python3
            gcc
            gnumake
            pkg-config
          ];

          shellHook = ''
            # NixOS has no CA bundle where workerd's bundled BoringSSL looks, so
            # `wrangler dev` TLS (e.g. Neon) fails without this. Same fix as
            # apps/api/scripts/dev.sh; setting it here covers every workspace.
            if [ -z "$SSL_CERT_FILE" ] && [ -f /etc/ssl/certs/ca-certificates.crt ]; then
              export SSL_CERT_FILE=/etc/ssl/certs/ca-certificates.crt
            fi

            echo "mhentai dev shell: node $(node -v), pnpm $(pnpm -v)"
          '';
        };
      });
}
