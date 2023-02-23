{ pkgs, lib, ... }:

{
	nix.nixPath = [ "nixpkgs=${pkgs.path}" ];

	services.postgresql = {
		enable = true;
		enableTCPIP = true;
		port = 5432;
		authentication = lib.mkForce ''
			local all all trust
			host  all all localhost trust
		'';
		initialScript = pkgs.writeText "init.sql" ''
			CREATE USER root WITH CREATEDB SUPERUSER;
		'';
	};

	environment.sessionVariables = rec {
		DATABASE_URL = "postgresql://root@127.0.0.1:5432/shadow?schema=public";
		SHADOW_DATABASE_URL = DATABASE_URL;
	};
}

# { pkgs ? import <nixpkgs> {} }:
# 
# let lib = pkgs.lib;
# 
# 	src = builtins.filterSource
# 		(path: type: ! builtins.elem (baseNameOf path) [ ".git" "result" ]) ./.;
# 
# 	test = pkgs.writeShellScript "test" ''
# 		echo "Hello World"
# 	'';
# 
# 	shell = import ./shell.nix { inherit pkgs; };
# 
# 	shellEnv =
# 		lib.concatStringsSep "\n"
# 			(lib.mapAttrsToList
# 				(k: v: "${k}=${lib.escapeShellArg v}")
# 				(lib.filterAttrs
# 					(k: v: (lib.toUpper k) == k)
# 					shell));
# 
# 	shellPkgs = shell.buildInputs;
# 
# 	run = script: pkgs.writeShellScript "test-run" ''
# 		if [[ ! -d /tmp/src ]]; then
# 			cp -r ${src} /tmp/src
# 		fi
# 		cd /tmp/src
# 
# 		set -o allexport
# 		${shellEnv}
# 		set +o allexport
# 
# 		${script} | systemd-cat -t test
# 	'';
# 
# in pkgs.nixosTest {
# 	nodes.machine = { pkgs, ... }: {
# 
# 		environment.systemPackages = shellPkgs ++ (with pkgs; [
# 			prisma-engines
# 		]);
# 
# 		virtualisation = {
# 			cores = 4;
# 			memorySize = 4096;
# 		};
# 	};
# 
# 	testScript = lib.concatStringsSep "\n" [
# 		''machine.succeed("${run "${pkgs.hello}/bin/hello"}")''
# 		''machine.wait_for_unit("postgresql.service")''
# 		''machine.wait_for_open_port(5432)''
# 		''machine.succeed("${run test}")''
# 	];
# }
