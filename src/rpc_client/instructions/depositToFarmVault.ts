import {
  TransactionInstruction,
  PublicKey,
  AccountMeta,
} from "@solana/web3.js"; // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js"; // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh"; // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types"; // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId";

export interface DepositToFarmVaultArgs {
  amount: BN;
}

export interface DepositToFarmVaultAccounts {
  depositor: PublicKey;
  farmState: PublicKey;
  farmVault: PublicKey;
  depositorAta: PublicKey;
  tokenProgram: PublicKey;
}

export const layout = borsh.struct([borsh.u64("amount")]);

export function depositToFarmVault(
  args: DepositToFarmVaultArgs,
  accounts: DepositToFarmVaultAccounts,
  programId: PublicKey = PROGRAM_ID,
) {
  const keys: Array<AccountMeta> = [
    { pubkey: accounts.depositor, isSigner: true, isWritable: false },
    { pubkey: accounts.farmState, isSigner: false, isWritable: true },
    { pubkey: accounts.farmVault, isSigner: false, isWritable: true },
    { pubkey: accounts.depositorAta, isSigner: false, isWritable: true },
    { pubkey: accounts.tokenProgram, isSigner: false, isWritable: false },
  ];
  const identifier = Buffer.from([131, 166, 64, 94, 108, 213, 114, 183]);
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
