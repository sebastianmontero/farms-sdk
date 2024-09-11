import {
  TransactionInstruction,
  PublicKey,
  AccountMeta,
} from "@solana/web3.js"; // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js"; // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh"; // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types"; // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId";

export interface WithdrawRewardArgs {
  amount: BN;
  rewardIndex: BN;
}

export interface WithdrawRewardAccounts {
  farmAdmin: PublicKey;
  farmState: PublicKey;
  rewardMint: PublicKey;
  rewardVault: PublicKey;
  farmVaultsAuthority: PublicKey;
  adminRewardTokenAta: PublicKey;
  scopePrices: PublicKey;
  tokenProgram: PublicKey;
}

export const layout = borsh.struct([
  borsh.u64("amount"),
  borsh.u64("rewardIndex"),
]);

export function withdrawReward(
  args: WithdrawRewardArgs,
  accounts: WithdrawRewardAccounts,
  programId: PublicKey = PROGRAM_ID,
) {
  const keys: Array<AccountMeta> = [
    { pubkey: accounts.farmAdmin, isSigner: true, isWritable: true },
    { pubkey: accounts.farmState, isSigner: false, isWritable: true },
    { pubkey: accounts.rewardMint, isSigner: false, isWritable: false },
    { pubkey: accounts.rewardVault, isSigner: false, isWritable: true },
    {
      pubkey: accounts.farmVaultsAuthority,
      isSigner: false,
      isWritable: false,
    },
    { pubkey: accounts.adminRewardTokenAta, isSigner: false, isWritable: true },
    { pubkey: accounts.scopePrices, isSigner: false, isWritable: false },
    { pubkey: accounts.tokenProgram, isSigner: false, isWritable: false },
  ];
  const identifier = Buffer.from([191, 187, 176, 137, 9, 25, 187, 244]);
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
