import {
  TransactionInstruction,
  PublicKey,
  AccountMeta,
} from "@solana/web3.js"; // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js"; // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh"; // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types"; // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId";

export interface InitializeRewardAccounts {
  farmAdmin: PublicKey;
  farmState: PublicKey;
  globalConfig: PublicKey;
  rewardMint: PublicKey;
  rewardVault: PublicKey;
  rewardTreasuryVault: PublicKey;
  farmVaultsAuthority: PublicKey;
  treasuryVaultsAuthority: PublicKey;
  tokenProgram: PublicKey;
  systemProgram: PublicKey;
  rent: PublicKey;
}

export function initializeReward(
  accounts: InitializeRewardAccounts,
  programId: PublicKey = PROGRAM_ID,
) {
  const keys: Array<AccountMeta> = [
    { pubkey: accounts.farmAdmin, isSigner: true, isWritable: true },
    { pubkey: accounts.farmState, isSigner: false, isWritable: true },
    { pubkey: accounts.globalConfig, isSigner: false, isWritable: false },
    { pubkey: accounts.rewardMint, isSigner: false, isWritable: false },
    { pubkey: accounts.rewardVault, isSigner: false, isWritable: true },
    { pubkey: accounts.rewardTreasuryVault, isSigner: false, isWritable: true },
    {
      pubkey: accounts.farmVaultsAuthority,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: accounts.treasuryVaultsAuthority,
      isSigner: false,
      isWritable: false,
    },
    { pubkey: accounts.tokenProgram, isSigner: false, isWritable: false },
    { pubkey: accounts.systemProgram, isSigner: false, isWritable: false },
    { pubkey: accounts.rent, isSigner: false, isWritable: false },
  ];
  const identifier = Buffer.from([95, 135, 192, 196, 242, 129, 230, 68]);
  const data = identifier;
  const ix = new TransactionInstruction({ keys, programId, data });
  return ix;
}
