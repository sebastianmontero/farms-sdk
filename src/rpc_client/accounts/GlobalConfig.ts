import { PublicKey, Connection } from "@solana/web3.js";
import BN from "bn.js"; // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh"; // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types"; // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId";

export interface GlobalConfigFields {
  globalAdmin: PublicKey;
  treasuryFeeBps: BN;
  treasuryVaultsAuthority: PublicKey;
  treasuryVaultsAuthorityBump: BN;
  pendingGlobalAdmin: PublicKey;
  padding1: Array<BN>;
}

export interface GlobalConfigJSON {
  globalAdmin: string;
  treasuryFeeBps: string;
  treasuryVaultsAuthority: string;
  treasuryVaultsAuthorityBump: string;
  pendingGlobalAdmin: string;
  padding1: Array<string>;
}

export class GlobalConfig {
  readonly globalAdmin: PublicKey;
  readonly treasuryFeeBps: BN;
  readonly treasuryVaultsAuthority: PublicKey;
  readonly treasuryVaultsAuthorityBump: BN;
  readonly pendingGlobalAdmin: PublicKey;
  readonly padding1: Array<BN>;

  static readonly discriminator = Buffer.from([
    149, 8, 156, 202, 160, 252, 176, 217,
  ]);

  static readonly layout = borsh.struct([
    borsh.publicKey("globalAdmin"),
    borsh.u64("treasuryFeeBps"),
    borsh.publicKey("treasuryVaultsAuthority"),
    borsh.u64("treasuryVaultsAuthorityBump"),
    borsh.publicKey("pendingGlobalAdmin"),
    borsh.array(borsh.u128(), 126, "padding1"),
  ]);

  constructor(fields: GlobalConfigFields) {
    this.globalAdmin = fields.globalAdmin;
    this.treasuryFeeBps = fields.treasuryFeeBps;
    this.treasuryVaultsAuthority = fields.treasuryVaultsAuthority;
    this.treasuryVaultsAuthorityBump = fields.treasuryVaultsAuthorityBump;
    this.pendingGlobalAdmin = fields.pendingGlobalAdmin;
    this.padding1 = fields.padding1;
  }

  static async fetch(
    c: Connection,
    address: PublicKey,
    programId: PublicKey = PROGRAM_ID,
  ): Promise<GlobalConfig | null> {
    const info = await c.getAccountInfo(address);

    if (info === null) {
      return null;
    }
    if (!info.owner.equals(programId)) {
      throw new Error("account doesn't belong to this program");
    }

    return this.decode(info.data);
  }

  static async fetchMultiple(
    c: Connection,
    addresses: PublicKey[],
    programId: PublicKey = PROGRAM_ID,
  ): Promise<Array<GlobalConfig | null>> {
    const infos = await c.getMultipleAccountsInfo(addresses);

    return infos.map((info) => {
      if (info === null) {
        return null;
      }
      if (!info.owner.equals(programId)) {
        throw new Error("account doesn't belong to this program");
      }

      return this.decode(info.data);
    });
  }

  static decode(data: Buffer): GlobalConfig {
    if (!data.slice(0, 8).equals(GlobalConfig.discriminator)) {
      throw new Error("invalid account discriminator");
    }

    const dec = GlobalConfig.layout.decode(data.slice(8));

    return new GlobalConfig({
      globalAdmin: dec.globalAdmin,
      treasuryFeeBps: dec.treasuryFeeBps,
      treasuryVaultsAuthority: dec.treasuryVaultsAuthority,
      treasuryVaultsAuthorityBump: dec.treasuryVaultsAuthorityBump,
      pendingGlobalAdmin: dec.pendingGlobalAdmin,
      padding1: dec.padding1,
    });
  }

  toJSON(): GlobalConfigJSON {
    return {
      globalAdmin: this.globalAdmin.toString(),
      treasuryFeeBps: this.treasuryFeeBps.toString(),
      treasuryVaultsAuthority: this.treasuryVaultsAuthority.toString(),
      treasuryVaultsAuthorityBump: this.treasuryVaultsAuthorityBump.toString(),
      pendingGlobalAdmin: this.pendingGlobalAdmin.toString(),
      padding1: this.padding1.map((item) => item.toString()),
    };
  }

  static fromJSON(obj: GlobalConfigJSON): GlobalConfig {
    return new GlobalConfig({
      globalAdmin: new PublicKey(obj.globalAdmin),
      treasuryFeeBps: new BN(obj.treasuryFeeBps),
      treasuryVaultsAuthority: new PublicKey(obj.treasuryVaultsAuthority),
      treasuryVaultsAuthorityBump: new BN(obj.treasuryVaultsAuthorityBump),
      pendingGlobalAdmin: new PublicKey(obj.pendingGlobalAdmin),
      padding1: obj.padding1.map((item) => new BN(item)),
    });
  }
}
