import {
  TransactionInstruction,
  PublicKey,
  AccountMeta,
} from "@solana/web3.js"; // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js"; // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh"; // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types"; // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId";

export interface IdlMissingTypesArgs {
  globalConfigOptionKind: types.GlobalConfigOptionKind;
  farmConfigOptionKind: types.FarmConfigOptionKind;
  timeUnit: types.TimeUnitKind;
  lockingMode: types.LockingModeKind;
  rewardType: types.RewardTypeKind;
}

export interface IdlMissingTypesAccounts {
  globalAdmin: PublicKey;
  globalConfig: PublicKey;
}

export const layout = borsh.struct([
  types.GlobalConfigOption.layout("globalConfigOptionKind"),
  types.FarmConfigOption.layout("farmConfigOptionKind"),
  types.TimeUnit.layout("timeUnit"),
  types.LockingMode.layout("lockingMode"),
  types.RewardType.layout("rewardType"),
]);

export function idlMissingTypes(
  args: IdlMissingTypesArgs,
  accounts: IdlMissingTypesAccounts,
  programId: PublicKey = PROGRAM_ID,
) {
  const keys: Array<AccountMeta> = [
    { pubkey: accounts.globalAdmin, isSigner: true, isWritable: false },
    { pubkey: accounts.globalConfig, isSigner: false, isWritable: true },
  ];
  const identifier = Buffer.from([130, 80, 38, 153, 80, 212, 182, 253]);
  const buffer = Buffer.alloc(1000);
  const len = layout.encode(
    {
      globalConfigOptionKind: args.globalConfigOptionKind.toEncodable(),
      farmConfigOptionKind: args.farmConfigOptionKind.toEncodable(),
      timeUnit: args.timeUnit.toEncodable(),
      lockingMode: args.lockingMode.toEncodable(),
      rewardType: args.rewardType.toEncodable(),
    },
    buffer,
  );
  const data = Buffer.concat([identifier, buffer]).slice(0, 8 + len);
  const ix = new TransactionInstruction({ keys, programId, data });
  return ix;
}
