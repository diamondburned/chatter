{ pkgs ? import <nixpkgs> {}, ... }:

let lib = pkgs.lib;

	unstable = import (pkgs.fetchFromGitHub {
		owner = "NixOS";
		repo = "nixpkgs";
		rev = "f00994e78cd39e6fc966f0c4103f908e63284780"; # nixos-unstable
		sha256 = "0kpnpja0pv4bk12iqia6avll31i85327p5drs2ycni14qa166y54";
	}) {};

	nixos-shell = pkgs.buildGoModule {
		pname = "nixos-shell";
		version = "e238cb5";

		src = pkgs.fetchFromGitHub {
			owner = "diamondburned";
			repo = "nixos-shell";
			rev = "e238cb522f7168fbc997101d00e6e2cc0d3e2ff9";
			sha256 = "02wqbfmc0c7q3896x6k2hxwcf1x202qfw0almb6rchlh7cqkva0w";
		};

		vendorSha256 = "0gjj1zn29vyx704y91g77zrs770y2rakksnn9dhg8r6na94njh5a";
	};

	prismaEnv = with unstable; {
		PRISMA_MIGRATION_ENGINE_BINARY = "${prisma-engines}/bin/migration-engine";
		PRISMA_QUERY_ENGINE_BINARY = "${prisma-engines}/bin/query-engine";
		PRISMA_QUERY_ENGINE_LIBRARY = "${prisma-engines}/lib/libquery_engine.node";
		PRISMA_INTROSPECTION_ENGINE_BINARY = "${prisma-engines}/bin/introspection-engine";
		PRISMA_FMT_BINARY = "${prisma-engines}/bin/prisma-fmt";
	};

	env = prismaEnv // {
		TESTING_API = "localhost:3000";
		UPLOAD_LIMIT_KB = "1024"; # 1 MB upload limit
		REGISTRATION_SECRET = "Kecef7aifieHah6or4UViifi5ri1Chae5LaTaekoo3chie1aik";
	};

in pkgs.mkShell (env // {
	buildInputs = with pkgs; [
		nodejs
		openssl
		nixos-shell
	];

	shellHook = ''
		PATH="$PWD/node_modules/.bin:$PATH"
	'';
})
