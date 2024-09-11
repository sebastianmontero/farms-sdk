import {
  TransactionInstruction,
  PublicKey,
  AccountMeta,
} from "@solana/web3.js"; // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js"; // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh"; // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types"; // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId";

export interface UnstakeArgs {
  stakeSharesScaled: BN;
}

export interface UnstakeAccounts {
  owner: PublicKey;
  userState: PublicKey;
  farmState: PublicKey;
  scopePrices: PublicKey;
}

export const layout = borsh.struct([borsh.u128("stakeSharesScaled")]);

export function unstake(
  args: UnstakeArgs,
  accounts: UnstakeAccounts,
  programId: PublicKey = PROGRAM_ID,
) {
  const keys: Array<AccountMeta> = [
    { pubkey: accounts.owner, isSigner: true, isWritable: true },
    { pubkey: accounts.userState, isSigner: false, isWritable: true },
    { pubkey: accounts.farmState, isSigner: false, isWritable: true },
    { pubkey: accounts.scopePrices, isSigner: false, isWritable: false },
  ];
  const identifier = Buffer.from([90, 95, 107, 42, 205, 124, 50, 225]);
  const buffer = Buffer.alloc(1000);
  const len = layout.encode(
    {
      stakeSharesScaled: args.stakeSharesScaled,
    },
    buffer,
  );
  const data = Buffer.concat([identifier, buffer]).slice(0, 8 + len);
  const ix = new TransactionInstruction({ keys, programId, data });
  return ix;
}
