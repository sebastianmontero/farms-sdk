import { PublicKey } from "@solana/web3.js";
import { Farms } from "../Farms";
import { getFarmsProgramId } from "../utils";
import { initializeClient } from "./utils";

export async function refreshFarmCommand(farm: string) {
  const admin = process.env.ADMIN;
  const rpc = process.env.RPC;
  const env = initializeClient(rpc!, admin!, getFarmsProgramId(rpc!), false);

  const farmsClient = new Farms(env.provider.connection);

  const sig = await farmsClient.refreshFarm(
    env.initialOwner,
    new PublicKey(farm),
    1,
  );

  console.log("Signature", sig);
}
