#!/usr/bin/env bash
set -eo pipefail

main() {
	if [[ "$1" == "" ]]; then
		echo "Usage: $0 <migration name>" >&2
		return 1
	fi

	prisma migrate dev --name "$1"
}

prisma() {
	command prisma "$@" --schema ./src/lib/db/schema.prisma
}

if (( EUID != 0 )); then
	exec sudo "$0" "$@"
fi

case "$1" in
_1)
	cd /src

	[[ -f .env   ]] && source .env
	[[ -f .envrc ]] && eval "$(grep '^export' .envrc)"

	export SHADOW_DATABASE_URL
	export DATABASE_URL="${SHADOW_DATABASE_URL}"

	env | grep DATABASE_URL

	nix-shell --run "./prisma-migrate.sh _2 $2"
	;;
_2)
	# set -x
	set -- $(base64 -d <<< "$2")
	main "$@"
	;;
*)
	# Deal with nixos-shell being stupid.
	for i in $(ip a | sed -n 's/.*\(ve-[a-z0-9]*\?\)@.*/\1/p'); do
		echo "Deleting interface $i"
		ip link del $i
	done

	args=
	if (( $# > 0 )); then
		args=$(printf '%q ' "$@" | base64 -w0)
	fi

	nixos-shell \
		-C ./prisma-shadow-container.nix \
		-c "./prisma-migrate.sh _1 $args"
esac
