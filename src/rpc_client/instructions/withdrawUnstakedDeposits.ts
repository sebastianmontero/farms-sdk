import {
  TransactionInstruction,
  PublicKey,
  AccountMeta,
} from "@solana/web3.js"; // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js"; // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh"; // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types"; // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId";

export interface WithdrawUnstakedDepositsAccounts {
  owner: PublicKey;
  userState: PublicKey;
  farmState: PublicKey;
  userAta: PublicKey;
  farmVault: PublicKey;
  farmVaultsAuthority: PublicKey;
  tokenProgram: PublicKey;
}

export function withdrawUnstakedDeposits(
  accounts: WithdrawUnstakedDepositsAccounts,
  programId: PublicKey = PROGRAM_ID,
) {
  const keys: Array<AccountMeta> = [
    { pubkey: accounts.owner, isSigner: true, isWritable: true },
    { pubkey: accounts.userState, isSigner: false, isWritable: true },
    { pubkey: accounts.farmState, isSigner: false, isWritable: true },
    { pubkey: accounts.userAta, isSigner: false, isWritable: true },
    { pubkey: accounts.farmVault, isSigner: false, isWritable: true },
    {
      pubkey: accounts.farmVaultsAuthority,
      isSigner: false,
      isWritable: false,
    },
    { pubkey: accounts.tokenProgram, isSigner: false, isWritable: false },
  ];
  const identifier = Buffer.from([36, 102, 187, 49, 220, 36, 132, 67]);
  const data = identifier;
  const ix = new TransactionInstruction({ keys, programId, data });
  return ix;
}
