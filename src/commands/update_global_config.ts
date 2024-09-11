import { PublicKey } from "@solana/web3.js";
import { GlobalConfig } from "../rpc_client/accounts";
import { Env, getFarmsProgramId } from "../utils";
import { initializeClient } from "./utils";
import { Farms } from "../Farms";
import { GlobalConfigOption } from "../rpc_client/types";

export async function updateGlobalConfigCommand(
  updateMode: string,
  flagValueType: string,
  flagValue: string,
  mode: string,
  priorityFeeMultiplier: number,
) {
  const admin = process.env.ADMIN!;
  const rpc = process.env.RPC!;
  const globalConfig = new PublicKey(process.env.FARMS_GLOBAL_CONFIG!);
  const env = initializeClient(
    rpc,
    admin,
    getFarmsProgramId(rpc),
    mode === "multisig",
  );

  let globalConfigPk = new PublicKey(globalConfig);

  await updateGlobalConfig(
    env,
    globalConfigPk,
    updateMode,
    flagValueType,
    flagValue,
    mode,
    priorityFeeMultiplier,
  );

  let globalConfigState: GlobalConfig | null = await GlobalConfig.fetch(
    env.provider.connection,
    new PublicKey(globalConfig),
  );
  mode !== "multisig" &&
    console.log("Global Config", globalConfigState?.toJSON());
}

async function updateGlobalConfig(
  env: Env,
  globalConfig: PublicKey,
  modeName: string,
  flagValueType: string,
  flagValue: string,
  mode: string,
  priorityFeeMultiplier: number,
) {
  if (
    flagValueType != "number" &&
    flagValueType != "bool" &&
    flagValueType != "boolean" &&
    flagValueType != "publicKey"
  ) {
    throw new Error(
      "The type is invalid, it should be 'number', 'bool' or 'publicKey",
    );
  }

  const farmsClient = new Farms(env.provider.connection);

  await farmsClient.updateGlobalConfig(
    env.initialOwner,
    globalConfig,
    GlobalConfigOption.fromDecoded({ [modeName]: "" }),
    flagValue,
    flagValueType,
    mode,
    priorityFeeMultiplier,
    env.web3Client,
  );

  mode !== "multisig" &&
    console.log(
      "Update Global Config: " +
        globalConfig.toString() +
        " mode: " +
        modeName +
        " value: " +
        flagValue,
    );
}
