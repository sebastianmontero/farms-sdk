import { getFarmsProgramId } from "../utils";
import { initializeClient } from "./utils";
import { Farms } from "../Farms";
import * as fs from "fs";

export async function downloadAllFarmStates() {
  const admin = process.env.ADMIN!;
  const rpc = process.env.RPC!;

  const env = initializeClient(rpc, admin, getFarmsProgramId(rpc), false);

  const farmClient = new Farms(env.provider.connection);

  const farmStates = await farmClient.getAllFarmStates();

  const farmAndAdmin: { farm: string; admin: string }[] = [];

  farmStates.forEach((state) => {
    farmAndAdmin.push({
      farm: state.key.toBase58(),
      admin: state.farmState.farmAdmin.toBase58(),
    });
  });

  fs.writeFileSync(`./farmStates.json`, JSON.stringify(farmAndAdmin, null, 2));
}
