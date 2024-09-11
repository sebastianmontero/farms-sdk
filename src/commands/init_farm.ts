import { PublicKey } from "@solana/web3.js";
import { initializeClient } from "./utils";
import { getFarmsProgramId, setUpFarm } from "../utils";
import { FarmState } from "../rpc_client/accounts";

export async function initFarm(
  tokenMint: string,
  mode: string,
  priorityFeeMultiplier: number,
) {
  const admin = process.env.ADMIN!;
  const rpc = process.env.RPC!;
  const env = initializeClient(
    rpc,
    admin,
    getFarmsProgramId(rpc),
    mode === "multisig",
  );
  const globalConfig = new PublicKey(process.env.FARMS_GLOBAL_CONFIG!);

  let farmAccounts = await setUpFarm(
    env,
    globalConfig,
    new PublicKey(tokenMint),
    env.initialOwner,
    mode,
    priorityFeeMultiplier,
  );

  let farmState: FarmState | null = await FarmState.fetch(
    env.provider.connection,
    farmAccounts.farmState.publicKey,
  );
  mode !== "multisig" && console.log("Farm State", farmState?.toJSON());
  mode !== "multisig" &&
    console.log("Farm account", farmAccounts.farmState.publicKey.toString());
}
