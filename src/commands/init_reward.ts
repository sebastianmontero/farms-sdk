import { rpc } from "@coral-xyz/anchor/dist/cjs/utils";
import { PublicKey } from "@solana/web3.js";
import { Farms } from "../Farms";
import { FarmState } from "../rpc_client/accounts";
import { getFarmsProgramId } from "../utils";
import { initializeClient } from "./utils";

export async function initRewardCommand(
  farm: string,
  rewardMint: string,
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
  const farmState = await FarmState.fetch(
    env.provider.connection,
    new PublicKey(farm),
  );
  if (!farmState) {
    throw new Error("Farm not found");
  }

  const farmsClient = new Farms(env.provider.connection);
  const mint = new PublicKey(rewardMint);
  const tokenProgram = (await env.provider.connection.getAccountInfo(mint))
    ?.owner!;

  const sig = await farmsClient.addRewardToFarm(
    env.initialOwner,
    farmState.globalConfig,
    new PublicKey(farm),
    mint,
    tokenProgram,
    mode,
    priorityFeeMultiplier,
    env.web3Client,
  );

  mode !== "multisig" && console.log("Signature", sig);
}
