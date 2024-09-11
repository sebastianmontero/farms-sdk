import { PublicKey } from "@solana/web3.js";
import { getFarmsProgramId } from "../utils";
import { initializeClient } from "./utils";
import * as fs from "fs";
import { FarmConfigOption } from "../rpc_client/types";
import { Farms } from "../Farms";

export async function updateAllFarmsPendingAdminsFromFile(
  file: string,
  pendingAdmin: string,
  mode: string,
  priorityFeeMultiplier: number,
) {
  const rpc = process.env.RPC!;
  const admin = process.env.ADMIN!;

  const env = initializeClient(
    rpc,
    admin,
    getFarmsProgramId(rpc),
    mode === "multisig",
  );

  const pendingAdminPk = new PublicKey(pendingAdmin);

  let rawData = fs.readFileSync(file, "utf8");
  let farmsData: { farm: string; admin: string }[] = JSON.parse(rawData);

  const farmClient = new Farms(env.provider.connection);

  for (const farm of farmsData) {
    if (new PublicKey(farm.admin).equals(env.initialOwner.publicKey)) {
      const sig = await farmClient.updateFarmConfig(
        env.initialOwner,
        new PublicKey(farm.farm),
        PublicKey.default,
        new FarmConfigOption.UpdatePendingFarmAdmin(),
        pendingAdminPk,
        mode,
        priorityFeeMultiplier,
        env.web3Client,
      );
      mode !== "multisig" && console.log("Signature", sig);
    }
  }
}
