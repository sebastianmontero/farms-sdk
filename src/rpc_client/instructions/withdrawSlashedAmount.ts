import {
  TransactionInstruction,
  PublicKey,
  AccountMeta,
} from "@solana/web3.js"; // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js"; // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh"; // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types"; // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId";

export interface WithdrawSlashedAmountAccounts {
  crank: PublicKey;
  farmState: PublicKey;
  slashedAmountSpillAddress: PublicKey;
  farmVault: PublicKey;
  farmVaultsAuthority: PublicKey;
  tokenProgram: PublicKey;
}

export function withdrawSlashedAmount(
  accounts: WithdrawSlashedAmountAccounts,
  programId: PublicKey = PROGRAM_ID,
) {
  const keys: Array<AccountMeta> = [
    { pubkey: accounts.crank, isSigner: true, isWritable: true },
    { pubkey: accounts.farmState, isSigner: false, isWritable: true },
    {
      pubkey: accounts.slashedAmountSpillAddress,
      isSigner: false,
      isWritable: true,
    },
    { pubkey: accounts.farmVault, isSigner: false, isWritable: true },
    {
      pubkey: accounts.farmVaultsAuthority,
      isSigner: false,
      isWritable: false,
    },
    { pubkey: accounts.tokenProgram, isSigner: false, isWritable: false },
  ];
  const identifier = Buffer.from([202, 217, 67, 74, 172, 22, 140, 216]);
  const data = identifier;
  const ix = new TransactionInstruction({ keys, programId, data });
  return ix;
}
