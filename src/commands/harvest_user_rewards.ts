import { OraclePrices } from "@hubbleprotocol/scope-sdk";
import { PublicKey, Transaction } from "@solana/web3.js";
import Decimal from "decimal.js";
import { Farms, printSimulateTx } from "../Farms";
import { FarmState, UserState } from "../rpc_client/accounts";
import { calculatePendingRewards, getFarmsProgramId } from "../utils";
import { initializeClient } from "./utils";

export async function harvestUserRewardsCommand(
  farm: string,
  user: string,
  rewardMint: string,
) {
  const admin = process.env.ADMIN;
  const rpc = process.env.RPC;
  const env = initializeClient(rpc!, admin!, getFarmsProgramId(rpc!), false);

  const farmsClient = new Farms(env.provider.connection);

  const farmPk = new PublicKey(farm);
  const userPk = new PublicKey(user);
  const rewardMintPk = new PublicKey(rewardMint);

  const userStateAndKey = await farmsClient.getUserStateKeyForUndelegatedFarm(
    userPk,
    farmPk,
  );

  let farmState = await FarmState.fetch(env.provider.connection, farmPk);
  if (!farmState) {
    throw new Error("Farm not found");
  }

  let userState = userStateAndKey.userState;

  let oraclePrices: OraclePrices | null = null;
  if (!farmState.scopePrices.equals(PublicKey.default)) {
    oraclePrices = await OraclePrices.fetch(
      env.provider.connection,
      farmState.scopePrices,
    );
  }

  let ts = new Date().getTime() / 1000;
  let pendingAmount = calculatePendingRewards(
    farmState!,
    userState!,
    0,
    new Decimal(ts),
    oraclePrices,
  );

  console.log("Pending Amount", pendingAmount.toString());

  let [_ataIxns, harvestIx] = await farmsClient.claimForUserForFarmRewardIx(
    userPk,
    farmPk,
    rewardMintPk,
    false,
    0,
  );

  const { blockhash } = await env.provider.connection.getLatestBlockhash();
  let txn = new Transaction();
  txn.add(...harvestIx);
  txn.recentBlockhash = blockhash;
  txn.feePayer = new PublicKey(user);

  await printSimulateTx(env.provider.connection, txn);
}
