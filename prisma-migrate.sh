#!/usr/bin/env bash
set -euo pipefail

main() {
	prisma migrate dev --schema ./src/lib/db/schema.prisma
}

if (( EUID != 0 )); then
	exec sudo "$0" "$@"
fi

case "${1:-}" in
_1)
	cd /src
	nix-shell --run "./prisma-migrate.sh _2 $2"
	;;
_2)
	args="$2"
	args="$(base64 -d <<< "$args")"
	main $args
	;;
*)
	# Deal with nixos-shell being stupid.
	for i in $(ip a | sed -n 's/.*\(ve-[a-z0-9]*\?\)@.*/\1/p'); do
		echo "Deleting interface $i"
		ip link del $i
	done

	args=$(printf '%q ' "$@" | base64 -w0)
	nixos-shell \
		-C ./prisma-shadow-container.nix \
		-c "./prisma-migrate.sh _1 $args"
esac
