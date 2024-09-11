import { PublicKey } from "@solana/web3.js";
import { initializeClient } from "./utils";
import { getFarmsProgramId } from "../utils";
import { Farms } from "../Farms";

export async function updateFarmAdminCommand(
  farm: string,
  mode: string,
  priorityFeeMultiplier: number,
) {
  const admin = process.env.ADMIN!;
  const rpc = process.env.RPC!;
  // use globalConfigOverride only if it's different than Pubkey.default
  const globalConfigAddress = new PublicKey(process.env.FARMS_GLOBAL_CONFIG!);
  const env = initializeClient(
    rpc,
    admin,
    getFarmsProgramId(rpc),
    mode === "multisig",
  );

  const farmsClient = new Farms(env.provider.connection);

  await farmsClient.updateFarmAdmin(
    env.initialOwner,
    new PublicKey(farm),
    mode,
    priorityFeeMultiplier,
    env.web3Client,
  );
}
