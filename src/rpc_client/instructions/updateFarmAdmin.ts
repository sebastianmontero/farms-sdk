import {
  TransactionInstruction,
  PublicKey,
  AccountMeta,
} from "@solana/web3.js"; // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js"; // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh"; // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types"; // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId";

export interface UpdateFarmAdminAccounts {
  pendingFarmAdmin: PublicKey;
  farmState: PublicKey;
}

export function updateFarmAdmin(
  accounts: UpdateFarmAdminAccounts,
  programId: PublicKey = PROGRAM_ID,
) {
  const keys: Array<AccountMeta> = [
    { pubkey: accounts.pendingFarmAdmin, isSigner: true, isWritable: true },
    { pubkey: accounts.farmState, isSigner: false, isWritable: true },
  ];
  const identifier = Buffer.from([20, 37, 136, 19, 122, 239, 36, 130]);
  const data = identifier;
  const ix = new TransactionInstruction({ keys, programId, data });
  return ix;
}
