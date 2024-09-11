import {
  TransactionInstruction,
  PublicKey,
  AccountMeta,
} from "@solana/web3.js"; // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js"; // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh"; // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types"; // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId";

export interface TransferOwnershipArgs {
  newOwner: PublicKey;
}

export interface TransferOwnershipAccounts {
  owner: PublicKey;
  userState: PublicKey;
}

export const layout = borsh.struct([borsh.publicKey("newOwner")]);

export function transferOwnership(
  args: TransferOwnershipArgs,
  accounts: TransferOwnershipAccounts,
  programId: PublicKey = PROGRAM_ID,
) {
  const keys: Array<AccountMeta> = [
    { pubkey: accounts.owner, isSigner: true, isWritable: false },
    { pubkey: accounts.userState, isSigner: false, isWritable: true },
  ];
  const identifier = Buffer.from([65, 177, 215, 73, 53, 45, 99, 47]);
  const buffer = Buffer.alloc(1000);
  const len = layout.encode(
    {
      newOwner: args.newOwner,
    },
    buffer,
  );
  const data = Buffer.concat([identifier, buffer]).slice(0, 8 + len);
  const ix = new TransactionInstruction({ keys, programId, data });
  return ix;
}
