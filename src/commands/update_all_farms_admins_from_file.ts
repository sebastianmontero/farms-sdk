import { PublicKey } from "@solana/web3.js";
import { Farms } from "../Farms";
import * as fs from "fs";
import { getFarmsProgramId } from "../utils";
import { initializeClient } from "./utils";

export async function updateAllFarmsAdminsFromFile(
  file: string,
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

  let rawData = fs.readFileSync(file, "utf8");
  let farmsData: { farm: string; admin: string }[] = JSON.parse(rawData);

  const farmClient = new Farms(env.provider.connection);

  for (const farm of farmsData) {
    const sig = await farmClient.updateFarmAdmin(
      env.initialOwner,
      new PublicKey(farm.farm),
      mode,
      priorityFeeMultiplier,
      env.web3Client,
    );
    mode !== "multisig" && console.log("Signature", sig);
  }
}
