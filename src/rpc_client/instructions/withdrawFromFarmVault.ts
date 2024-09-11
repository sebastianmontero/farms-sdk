import {
  TransactionInstruction,
  PublicKey,
  AccountMeta,
} from "@solana/web3.js"; // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js"; // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh"; // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types"; // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId";

export interface WithdrawFromFarmVaultArgs {
  amount: BN;
}

export interface WithdrawFromFarmVaultAccounts {
  withdrawAuthority: PublicKey;
  farmState: PublicKey;
  withdrawerTokenAccount: PublicKey;
  farmVault: PublicKey;
  farmVaultsAuthority: PublicKey;
  tokenProgram: PublicKey;
}

export const layout = borsh.struct([borsh.u64("amount")]);

export function withdrawFromFarmVault(
  args: WithdrawFromFarmVaultArgs,
  accounts: WithdrawFromFarmVaultAccounts,
  programId: PublicKey = PROGRAM_ID,
) {
  const keys: Array<AccountMeta> = [
    { pubkey: accounts.withdrawAuthority, isSigner: true, isWritable: true },
    { pubkey: accounts.farmState, isSigner: false, isWritable: true },
    {
      pubkey: accounts.withdrawerTokenAccount,
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
  const identifier = Buffer.from([22, 82, 128, 250, 86, 79, 124, 78]);
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
