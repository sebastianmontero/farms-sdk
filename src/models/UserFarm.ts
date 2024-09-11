import { PublicKey } from "@solana/web3.js";
import Decimal from "decimal.js";
import { RewardInfo } from "../rpc_client/types";
import { PubkeyHashMap } from "@kamino-finance/klend-sdk";

export type UserFarm = {
  userStateAddress: PublicKey;
  farm: PublicKey;
  stakedToken: PublicKey;
  activeStakeByDelegatee: PubkeyHashMap<PublicKey, Decimal>; // key is the delegate address
  pendingDepositStakeByDelegatee: PubkeyHashMap<PublicKey, Decimal>; // key is the delegate address
  pendingWithdrawalUnstakeByDelegatee: PubkeyHashMap<PublicKey, Decimal>; // key is the delegate address
  pendingRewards: PendingReward[];
  delegateAuthority: PublicKey;
  strategyId: PublicKey;
};

export type PendingReward = {
  rewardTokenMint: PublicKey;
  rewardTokenProgramId: PublicKey;
  rewardType: RewardInfo["rewardType"];
  cumulatedPendingRewards: Decimal;
  pendingRewardsByDelegatee: PubkeyHashMap<PublicKey, Decimal>;
};
