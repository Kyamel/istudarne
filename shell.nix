# Thin compatibility shim: the toolchain is defined once in flake.nix
# (devShells.default). This lets `nix-shell` keep working for anyone not using
# flakes — it evaluates the flake through flake-compat, which flake.lock pins.
#
# Requires flake.lock to exist: run `nix flake lock` once after cloning.
(import
  (
    let
      lock = builtins.fromJSON (builtins.readFile ./flake.lock);
      compat = lock.nodes.flake-compat.locked;
    in
    fetchTarball {
      url = "https://github.com/edolstra/flake-compat/archive/${compat.rev}.tar.gz";
      sha256 = compat.narHash;
    }
  )
  { src = ./.; }).shellNix
