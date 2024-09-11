import {
  TransactionInstruction,
  PublicKey,
  AccountMeta,
} from "@solana/web3.js"; // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js"; // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh"; // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types"; // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId";

export interface WithdrawTreasuryArgs {
  amount: BN;
}

export interface WithdrawTreasuryAccounts {
  globalAdmin: PublicKey;
  globalConfig: PublicKey;
  rewardMint: PublicKey;
  rewardTreasuryVault: PublicKey;
  treasuryVaultAuthority: PublicKey;
  withdrawDestinationTokenAccount: PublicKey;
  tokenProgram: PublicKey;
}

export const layout = borsh.struct([borsh.u64("amount")]);

export function withdrawTreasury(
  args: WithdrawTreasuryArgs,
  accounts: WithdrawTreasuryAccounts,
  programId: PublicKey = PROGRAM_ID,
) {
  const keys: Array<AccountMeta> = [
    { pubkey: accounts.globalAdmin, isSigner: true, isWritable: true },
    { pubkey: accounts.globalConfig, isSigner: false, isWritable: false },
    { pubkey: accounts.rewardMint, isSigner: false, isWritable: false },
    { pubkey: accounts.rewardTreasuryVault, isSigner: false, isWritable: true },
    {
      pubkey: accounts.treasuryVaultAuthority,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: accounts.withdrawDestinationTokenAccount,
      isSigner: false,
      isWritable: true,
    },
    { pubkey: accounts.tokenProgram, isSigner: false, isWritable: false },
  ];
  const identifier = Buffer.from([40, 63, 122, 158, 144, 216, 83, 96]);
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
