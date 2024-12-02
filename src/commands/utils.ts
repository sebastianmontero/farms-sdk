import {
  ComputeBudgetProgram,
  PublicKey,
  TransactionInstruction,
} from "@solana/web3.js";
import { Env, setUpProgram } from "../utils";

export function createAddExtraComputeUnitFeeTransaction(
  units: number,
  microLamports: number,
): TransactionInstruction[] {
  const ixns: TransactionInstruction[] = [];
  ixns.push(ComputeBudgetProgram.setComputeUnitLimit({ units }));
  ixns.push(ComputeBudgetProgram.setComputeUnitPrice({ microLamports }));
  return ixns;
}

export function initializeClient(
  cluster: string,
  admin: string,
  programId: PublicKey,
  multisig: boolean,
): Env {
  let resolvedCluster: string;
  let resolvedAdmin: string;

  if (cluster) {
    resolvedCluster = cluster;
  } else {
    throw "Must specify cluster";
  }

  if (admin) {
    resolvedAdmin = admin;
  } else {
    throw "Must specify admin";
  }

  // Get connection first
  const env: Env = setUpProgram({
    adminFilePath: admin,
    clusterOverride: cluster,
    programOverride: programId,
  });

  !multisig && console.log("\nSettings ⚙️");
  !multisig && console.log("Program ID:", env.programId.toString());
  !multisig && console.log("Admin:", resolvedAdmin);
  !multisig && console.log("Cluster:", resolvedCluster);

  return env;
}

export function unwrap(val: any): any {
  if (val) {
    return val;
  } else {
    throw new Error("Value is null");
  }
}
