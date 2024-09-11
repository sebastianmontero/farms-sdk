import { rpc } from "@coral-xyz/anchor/dist/cjs/utils";
import { PublicKey } from "@solana/web3.js";
import Decimal from "decimal.js";
import { Farms } from "../Farms";
import { FarmConfigOption } from "../rpc_client/types";
import { getFarmsProgramId } from "../utils";
import { initializeClient } from "./utils";

export async function updateFarmConfigCommand(
  farm: string,
  rewardMint: string,
  updateMode: string,
  flagValue: string,
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

  const farmsClient = new Farms(env.provider.connection);

  let flagValueNumber = -1;
  let flagValuePk = PublicKey.default;
  let value: number | PublicKey = -1;

  try {
    flagValueNumber = new Decimal(flagValue).toNumber();
    value = flagValueNumber;
  } catch (e) {
    // Pass
  }

  try {
    flagValuePk = new PublicKey(flagValue);
    value = flagValuePk;
  } catch (e) {
    // Pass
  }

  if (flagValueNumber == -1 && flagValuePk == PublicKey.default) {
    // Can't be neither
    console.log(flagValueNumber, flagValuePk);
    throw new Error("Flag value is not a valid number or public key");
  }

  if (flagValueNumber != -1 && flagValuePk != PublicKey.default) {
    console.log(flagValueNumber, flagValuePk);
    // Can't have both
    throw new Error("Flag value is both a valid number and a valid public key");
  }

  const sig = await farmsClient.updateFarmConfig(
    env.initialOwner,
    new PublicKey(farm),
    new PublicKey(rewardMint),
    FarmConfigOption.fromDecoded({ [updateMode]: "" }),
    value,
    mode,
    priorityFeeMultiplier,
    env.web3Client,
  );

  mode !== "multisig" && console.log("Signature", sig);
}
