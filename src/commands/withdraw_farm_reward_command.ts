import { PublicKey, Transaction } from "@solana/web3.js";
import Decimal from "decimal.js";
import { Farms, printMultisigTx, printSimulateTx } from "../Farms";
import { FarmState } from "../rpc_client/accounts";
import { getFarmsProgramId } from "../utils";
import {
  createAddExtraComputeUnitFeeTransaction,
  initializeClient,
} from "./utils";
import { sendAndConfirmTransactionV0 } from "./refresh_all_klend_user_obligation_farms_from_file";

const microLamport = 5 * 10 ** 6; // 1 lamport
const computeUnits = 1_000_000;
const microLamportsPrioritizationFee = microLamport / computeUnits;

export async function withdrawFarmRewardCommand(
  farm: string,
  rewardMint: string,
  amount: string,
  mode: string,
  priorityFeeMultiplier: number,
) {
  const admin = process.env.ADMIN;
  const rpc = process.env.RPC;

  const env = initializeClient(rpc!, admin!, getFarmsProgramId(rpc!), false);
  const farmsClient = new Farms(env.provider.connection);

  const farmPubkey = new PublicKey(farm);
  const farmState = await FarmState.fetch(env.provider.connection, farmPubkey);
  const rewardMintPubkey = new PublicKey(rewardMint);
  const amountToWithdraw = new Decimal(amount);

  if (!farmState) {
    throw new Error("Farm not found");
  }

  const withdrawIxn = await farmsClient.withdrawRewardAmountFromFarmIx(
    farmState.farmAdmin,
    farmPubkey,
    rewardMintPubkey,
    amountToWithdraw,
  );

  // 5. Send or print txn
  const { blockhash } = await env.provider.connection.getLatestBlockhash();
  let txn = new Transaction();
  txn.recentBlockhash = blockhash;
  txn.feePayer = env.initialOwner.publicKey;

  if (mode !== "multisig") {
    const priorityFeeIxn = createAddExtraComputeUnitFeeTransaction(
      computeUnits,
      microLamportsPrioritizationFee * priorityFeeMultiplier,
    );
    txn.add(...priorityFeeIxn);
  }
  txn.add(withdrawIxn);
  if (mode === "simulate") {
    await printSimulateTx(env.provider.connection, txn);
  } else if (mode === "multisig") {
    await printMultisigTx(txn);
  } else if (mode === "execute") {
    console.log("Sending.");
    const sig = await sendAndConfirmTransactionV0(
      env.provider.connection,
      env.initialOwner,
      txn.instructions,
      [],
      [env.initialOwner],
    );
    console.log("Farm", farmPubkey.toString());
    console.log("Signature", sig);
  }
}
