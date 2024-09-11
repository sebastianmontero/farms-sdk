import {
  TransactionInstruction,
  PublicKey,
  AccountMeta,
} from "@solana/web3.js"; // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js"; // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh"; // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types"; // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId";

export interface RefreshFarmAccounts {
  farmState: PublicKey;
  scopePrices: PublicKey;
}

export function refreshFarm(
  accounts: RefreshFarmAccounts,
  programId: PublicKey = PROGRAM_ID,
) {
  const keys: Array<AccountMeta> = [
    { pubkey: accounts.farmState, isSigner: false, isWritable: true },
    { pubkey: accounts.scopePrices, isSigner: false, isWritable: false },
  ];
  const identifier = Buffer.from([214, 131, 138, 183, 144, 194, 172, 42]);
  const data = identifier;
  const ix = new TransactionInstruction({ keys, programId, data });
  return ix;
}
