import {
  TransactionInstruction,
  PublicKey,
  AccountMeta,
} from "@solana/web3.js"; // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js"; // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh"; // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types"; // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId";

export interface AddRewardsArgs {
  amount: BN;
  rewardIndex: BN;
}

export interface AddRewardsAccounts {
  payer: PublicKey;
  farmState: PublicKey;
  rewardMint: PublicKey;
  rewardVault: PublicKey;
  farmVaultsAuthority: PublicKey;
  payerRewardTokenAta: PublicKey;
  scopePrices: PublicKey;
  tokenProgram: PublicKey;
}

export const layout = borsh.struct([
  borsh.u64("amount"),
  borsh.u64("rewardIndex"),
]);

export function addRewards(
  args: AddRewardsArgs,
  accounts: AddRewardsAccounts,
  programId: PublicKey = PROGRAM_ID,
) {
  const keys: Array<AccountMeta> = [
    { pubkey: accounts.payer, isSigner: true, isWritable: true },
    { pubkey: accounts.farmState, isSigner: false, isWritable: true },
    { pubkey: accounts.rewardMint, isSigner: false, isWritable: false },
    { pubkey: accounts.rewardVault, isSigner: false, isWritable: true },
    {
      pubkey: accounts.farmVaultsAuthority,
      isSigner: false,
      isWritable: false,
    },
    { pubkey: accounts.payerRewardTokenAta, isSigner: false, isWritable: true },
    { pubkey: accounts.scopePrices, isSigner: false, isWritable: false },
    { pubkey: accounts.tokenProgram, isSigner: false, isWritable: false },
  ];
  const identifier = Buffer.from([88, 186, 25, 227, 38, 137, 81, 23]);
  const buffer = Buffer.alloc(1000);
  const len = layout.encode(
    {
      amount: args.amount,
      rewardIndex: args.rewardIndex,
    },
    buffer,
  );
  const data = Buffer.concat([identifier, buffer]).slice(0, 8 + len);
  const ix = new TransactionInstruction({ keys, programId, data });
  return ix;
}
