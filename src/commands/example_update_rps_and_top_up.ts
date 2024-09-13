import { PublicKey } from "@solana/web3.js";
import { initializeClient } from "./utils";
import { getFarmsProgramId } from "../utils";
import { Farms } from "../Farms";
import Decimal from "decimal.js";

export async function updateFarmRpsForRewardCommand(
  reward: PublicKey,
  farm: PublicKey,
  rewardsPerSecond: number,
) {
  const admin = process.env.ADMIN!;
  const rpc = process.env.RPC!;
  const env = initializeClient(rpc, admin, getFarmsProgramId(rpc), false);

  const farmsClient = new Farms(env.provider.connection);

  const updateIxn = await farmsClient.updateFarmRpsForRewardIx(
    env.initialOwner.publicKey,
    reward,
    farm,
    rewardsPerSecond,
  );

  const log =
    "Update rps for: " +
    farm.toString() +
    " of reward: " +
    reward.toString() +
    " to rps: " +
    rewardsPerSecond;

  return farmsClient.processTxn(
    env.initialOwner,
    [updateIxn],
    "execute",
    25000,
    log,
    [],
    env.web3Client,
  );
}

export async function topUpFarmForRewardForStrategy(
  reward: PublicKey,
  farm: PublicKey,
  amountToTopUp: Decimal,
) {
  const admin = process.env.ADMIN!;
  const rpc = process.env.RPC!;
  const env = initializeClient(rpc, admin, getFarmsProgramId(rpc), false);

  const farmsClient = new Farms(env.provider.connection);

  const topUpIx = await farmsClient.topUpFarmForRewardIx(
    env.initialOwner.publicKey,
    reward,
    farm,
    amountToTopUp,
  );

  const log =
    "Update rps for: " +
    farm.toString() +
    " of reward: " +
    reward.toString() +
    " to top up: " +
    topUpIx;

  return farmsClient.processTxn(
    env.initialOwner,
    [topUpIx],
    "execute",
    25000,
    log,
    [],
    env.web3Client,
  );
}
