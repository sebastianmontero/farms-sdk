import {
  TransactionInstruction,
  PublicKey,
  AccountMeta,
} from "@solana/web3.js"; // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js"; // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh"; // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types"; // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId";

export interface RewardUserOnceArgs {
  rewardIndex: BN;
  amount: BN;
}

export interface RewardUserOnceAccounts {
  farmAdmin: PublicKey;
  farmState: PublicKey;
  userState: PublicKey;
}

export const layout = borsh.struct([
  borsh.u64("rewardIndex"),
  borsh.u64("amount"),
]);

export function rewardUserOnce(
  args: RewardUserOnceArgs,
  accounts: RewardUserOnceAccounts,
  programId: PublicKey = PROGRAM_ID,
) {
  const keys: Array<AccountMeta> = [
    { pubkey: accounts.farmAdmin, isSigner: true, isWritable: true },
    { pubkey: accounts.farmState, isSigner: false, isWritable: true },
    { pubkey: accounts.userState, isSigner: false, isWritable: true },
  ];
  const identifier = Buffer.from([219, 137, 57, 22, 94, 186, 96, 114]);
  const buffer = Buffer.alloc(1000);
  const len = layout.encode(
    {
      rewardIndex: args.rewardIndex,
      amount: args.amount,
    },
    buffer,
  );
  const data = Buffer.concat([identifier, buffer]).slice(0, 8 + len);
  const ix = new TransactionInstruction({ keys, programId, data });
  return ix;
}
