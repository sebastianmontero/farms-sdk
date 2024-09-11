import { OraclePrices } from "@hubbleprotocol/scope-sdk";
import {
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import Decimal from "decimal.js";
import { Farms, printSimulateTx } from "../Farms";
import { FarmState } from "../rpc_client/accounts";
import { calculatePendingRewards, getFarmsProgramId } from "../utils";
import { initializeClient } from "./utils";
import { Reserve } from "@kamino-finance/klend-sdk";

export async function harvestKlendUserRewardsCommand(
  reserve: string,
  user: string,
  rewardMint: string,
) {
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

  const farms = [
    ["Collateral", collFarm],
    ["Debt", debtFarm],
  ];

  const ixs: TransactionInstruction[] = [];
  const ataIxns: [PublicKey, TransactionInstruction][] = [];
  for (const [farmType, farm] of farms) {
    const farmPk = new PublicKey(farm);
    const userPk = new PublicKey(user);
    const rewardMintPk = new PublicKey(rewardMint);

    const userStatePk = (
      await farmsClient.getUserStateKeysForDelegatedFarm(userPk, farmPk)
    )[0];

    let farmState = await FarmState.fetch(env.provider.connection, farmPk);
    if (!farmState) {
      throw new Error("Farm not found");
    }

    let userState = userStatePk.userState;

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

    console.log(
      `Pending Amount for ${farmType} is ${pendingAmount.toString()}`,
    );

    let [thisAtaIxns, harvestIx] =
      await farmsClient.claimForUserForFarmRewardIx(
        userPk,
        farmPk,
        rewardMintPk,
        true,
        0,
      );
    ixs.push(...harvestIx);
    ataIxns.push(...thisAtaIxns);
  }

  // Remove duplicate ataIxns that have the same value of the tuple as Pubkey
  const seen = new Set();
  let filteredAtaIxns = ataIxns
    .filter((item) => {
      let key = item[0].toString();
      return seen.has(key) ? false : seen.add(key);
    })
    .map((item) => item[1])
    .flat();

  const { blockhash } = await env.provider.connection.getLatestBlockhash();
  let txn = new Transaction();
  txn.add(...filteredAtaIxns, ...ixs);
  txn.recentBlockhash = blockhash;
  txn.feePayer = new PublicKey(user);

  await printSimulateTx(env.provider.connection, txn);
}
