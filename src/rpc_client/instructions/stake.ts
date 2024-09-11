import {
  TransactionInstruction,
  PublicKey,
  AccountMeta,
} from "@solana/web3.js"; // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js"; // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh"; // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types"; // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId";

export interface StakeArgs {
  amount: BN;
}

export interface StakeAccounts {
  owner: PublicKey;
  userState: PublicKey;
  farmState: PublicKey;
  farmVault: PublicKey;
  userAta: PublicKey;
  tokenMint: PublicKey;
  scopePrices: PublicKey;
  tokenProgram: PublicKey;
}

export const layout = borsh.struct([borsh.u64("amount")]);

export function stake(
  args: StakeArgs,
  accounts: StakeAccounts,
  programId: PublicKey = PROGRAM_ID,
) {
  const keys: Array<AccountMeta> = [
    { pubkey: accounts.owner, isSigner: true, isWritable: false },
    { pubkey: accounts.userState, isSigner: false, isWritable: true },
    { pubkey: accounts.farmState, isSigner: false, isWritable: true },
    { pubkey: accounts.farmVault, isSigner: false, isWritable: true },
    { pubkey: accounts.userAta, isSigner: false, isWritable: true },
    { pubkey: accounts.tokenMint, isSigner: false, isWritable: false },
    { pubkey: accounts.scopePrices, isSigner: false, isWritable: false },
    { pubkey: accounts.tokenProgram, isSigner: false, isWritable: false },
  ];
  const identifier = Buffer.from([206, 176, 202, 18, 200, 209, 179, 108]);
  const buffer = Buffer.alloc(1000);
  const len = layout.encode(
    {
      amount: args.amount,
    },
    buffer,
  );
  const data = Buffer.concat([identifier, buffer]).slice(0, 8 + len);
  const ix = new TransactionInstruction({ keys, programId, data });
  return ix;
}
