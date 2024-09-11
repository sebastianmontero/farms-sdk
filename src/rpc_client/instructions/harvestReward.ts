import {
  TransactionInstruction,
  PublicKey,
  AccountMeta,
} from "@solana/web3.js"; // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js"; // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh"; // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types"; // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId";

export interface HarvestRewardArgs {
  rewardIndex: BN;
}

export interface HarvestRewardAccounts {
  owner: PublicKey;
  userState: PublicKey;
  farmState: PublicKey;
  globalConfig: PublicKey;
  rewardMint: PublicKey;
  userRewardAta: PublicKey;
  rewardsVault: PublicKey;
  rewardsTreasuryVault: PublicKey;
  farmVaultsAuthority: PublicKey;
  scopePrices: PublicKey;
  tokenProgram: PublicKey;
}

export const layout = borsh.struct([borsh.u64("rewardIndex")]);

export function harvestReward(
  args: HarvestRewardArgs,
  accounts: HarvestRewardAccounts,
  programId: PublicKey = PROGRAM_ID,
) {
  const keys: Array<AccountMeta> = [
    { pubkey: accounts.owner, isSigner: true, isWritable: true },
    { pubkey: accounts.userState, isSigner: false, isWritable: true },
    { pubkey: accounts.farmState, isSigner: false, isWritable: true },
    { pubkey: accounts.globalConfig, isSigner: false, isWritable: false },
    { pubkey: accounts.rewardMint, isSigner: false, isWritable: false },
    { pubkey: accounts.userRewardAta, isSigner: false, isWritable: true },
    { pubkey: accounts.rewardsVault, isSigner: false, isWritable: true },
    {
      pubkey: accounts.rewardsTreasuryVault,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: accounts.farmVaultsAuthority,
      isSigner: false,
      isWritable: false,
    },
    { pubkey: accounts.scopePrices, isSigner: false, isWritable: false },
    { pubkey: accounts.tokenProgram, isSigner: false, isWritable: false },
  ];
  const identifier = Buffer.from([68, 200, 228, 233, 184, 32, 226, 188]);
  const buffer = Buffer.alloc(1000);
  const len = layout.encode(
    {
      rewardIndex: args.rewardIndex,
    },
    buffer,
  );
  const data = Buffer.concat([identifier, buffer]).slice(0, 8 + len);
  const ix = new TransactionInstruction({ keys, programId, data });
  return ix;
}
