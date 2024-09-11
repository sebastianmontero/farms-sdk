import {
  TransactionInstruction,
  PublicKey,
  AccountMeta,
} from "@solana/web3.js"; // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js"; // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh"; // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types"; // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId";

export interface UpdateFarmConfigArgs {
  mode: number;
  data: Uint8Array;
}

export interface UpdateFarmConfigAccounts {
  signer: PublicKey;
  farmState: PublicKey;
  scopePrices: PublicKey;
}

export const layout = borsh.struct([borsh.u16("mode"), borsh.vecU8("data")]);

export function updateFarmConfig(
  args: UpdateFarmConfigArgs,
  accounts: UpdateFarmConfigAccounts,
  programId: PublicKey = PROGRAM_ID,
) {
  const keys: Array<AccountMeta> = [
    { pubkey: accounts.signer, isSigner: true, isWritable: true },
    { pubkey: accounts.farmState, isSigner: false, isWritable: true },
    { pubkey: accounts.scopePrices, isSigner: false, isWritable: false },
  ];
  const identifier = Buffer.from([214, 176, 188, 244, 203, 59, 230, 207]);
  const buffer = Buffer.alloc(1000);
  const len = layout.encode(
    {
      mode: args.mode,
      data: Buffer.from(
        args.data.buffer,
        args.data.byteOffset,
        args.data.length,
      ),
    },
    buffer,
  );
  const data = Buffer.concat([identifier, buffer]).slice(0, 8 + len);
  const ix = new TransactionInstruction({ keys, programId, data });
  return ix;
}
