import {
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import {
  initFarmsForReserve,
  LendingMarket,
  lendingMarketAuthPda,
  Reserve,
} from "@kamino-finance/klend-sdk";
import { ReserveFarmKind } from "@kamino-finance/klend-sdk/dist/idl_codegen/types";
import { initializeClient } from "./utils";
import { getFarmAuthorityPDA, getFarmsProgramId } from "../utils";
import { Farms } from "../Farms";
import { FarmConfigOption } from "../rpc_client/types";

export async function initializeKlendFarmForReserve(
  reserve: PublicKey,
  kind: string,
  multisigToExecute: PublicKey,
  pendingAdmin: PublicKey,
  mode: string,
  priorityFeeMultiplier: number,
) {
  const admin = process.env.ADMIN!;
  const rpc = process.env.RPC!;
  const klendProgramId = new PublicKey(process.env.KLEND_PROGRAM_ID!);
  const farmsId = getFarmsProgramId(rpc);
  const env = initializeClient(rpc, admin, farmsId, mode === "multisig");
  if (mode === "multisig" && !multisigToExecute) {
    throw new Error(
      "Cannot initailize Klend farm without as multisig without multisig pubkey",
    );
  }
  const globalConfig = new PublicKey(process.env.FARMS_GLOBAL_CONFIG!);
  const farmClient = new Farms(env.provider.connection);

  const reserveState = await Reserve.fetch(
    env.provider.connection,
    reserve,
    klendProgramId,
  );

  if (!reserveState) {
    throw new Error("Reserve does not exist");
  }

  const [lendingMarketAuthority, _] = lendingMarketAuthPda(
    reserveState.lendingMarket,
    klendProgramId,
  );
  const lendingMarketOwner = (
    await LendingMarket.fetch(
      env.provider.connection,
      reserveState.lendingMarket,
      klendProgramId,
    )
  )?.lendingMarketOwner!;

  const SIZE_FARM_STATE = 8336;
  const farmState: Keypair = Keypair.generate();
  const createFarmIx = SystemProgram.createAccount({
    fromPubkey: env.initialOwner.publicKey,
    newAccountPubkey: farmState.publicKey,
    space: SIZE_FARM_STATE,
    lamports:
      await env.provider.connection.getMinimumBalanceForRentExemption(
        SIZE_FARM_STATE,
      ),
    programId: farmsId,
  });
  if (mode !== "simulate") {
    const createFarmSig = await farmClient.processTxn(
      env.initialOwner,
      [createFarmIx],
      "execute",
      priorityFeeMultiplier,
      "",
      [farmState],
      env.web3Client,
    );
    mode !== "multisig" &&
      console.log("Transaction signature: " + createFarmSig);
  }

  const initIx = initFarmsForReserve(
    {
      mode: ReserveFarmKind.fromDecoded({ [kind]: "" }).discriminator,
    },
    {
      lendingMarketOwner,
      lendingMarket: reserveState.lendingMarket,
      lendingMarketAuthority,
      reserve,
      farmsProgram: farmsId,
      farmsGlobalConfig: new PublicKey(globalConfig),
      farmState: farmState.publicKey,
      farmsVaultAuthority: getFarmAuthorityPDA(farmsId, farmState.publicKey),
      rent: SYSVAR_RENT_PUBKEY,
      systemProgram: SystemProgram.programId,
    },
    klendProgramId,
  );

  const updateFarmPendingAdminIx = await farmClient.updateFarmConfigIx(
    mode === "multisig" ? multisigToExecute : env.initialOwner.publicKey,
    farmState.publicKey,
    PublicKey.default,
    new FarmConfigOption.UpdatePendingFarmAdmin(),
    pendingAdmin,
    -1,
    getFarmsProgramId("mainnet"),
    true,
  );

  const sig = await farmClient.processTxn(
    env.initialOwner,
    [initIx, updateFarmPendingAdminIx],
    mode,
    priorityFeeMultiplier,
    "",
    [],
    env.web3Client,
  );
  mode !== "multisig" && console.log("Transaction signature: " + sig);
}
