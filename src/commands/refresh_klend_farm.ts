import { PublicKey } from "@solana/web3.js";
import { Farms } from "../Farms";
import { getFarmsProgramId } from "../utils";
import { initializeClient } from "./utils";
import { Reserve } from "@kamino-finance/klend-sdk";

export async function refreshKlendFarmsCommand(reserve: string) {
  const admin = process.env.ADMIN;
  const rpc = process.env.RPC;
  const klendProgramId = process.env.KLEND_PROGRAM_ID;
  const env = initializeClient(rpc!, admin!, getFarmsProgramId(rpc!), false);

  const farmsClient = new Farms(env.provider.connection);

  const reservePubkey = new PublicKey(reserve);
  const reserveState = await Reserve.fetch(
    env.provider.connection,
    reservePubkey,
    new PublicKey(klendProgramId || ""),
  );

  if (!reserveState) {
    throw new Error("Reserve not found");
  }

  const collFarm = reserveState.farmCollateral;
  const debtFarm = reserveState.farmDebt;

  if (!collFarm.equals(PublicKey.default)) {
    const sig = await farmsClient.refreshFarm(env.initialOwner, collFarm, 1);
    console.log("Refresh Coll Farm Signature", sig);
  }

  if (!debtFarm.equals(PublicKey.default)) {
    const sig = await farmsClient.refreshFarm(env.initialOwner, debtFarm, 1);
    console.log("Refresh Debt Farm Signature", sig);
  }
}
