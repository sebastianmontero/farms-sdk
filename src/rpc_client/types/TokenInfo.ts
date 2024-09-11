import { PublicKey } from "@solana/web3.js"; // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js"; // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types"; // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh";

export interface TokenInfoFields {
  mint: PublicKey;
  decimals: BN;
  tokenProgram: PublicKey;
  padding: Array<BN>;
}

export interface TokenInfoJSON {
  mint: string;
  decimals: string;
  tokenProgram: string;
  padding: Array<string>;
}

export class TokenInfo {
  readonly mint: PublicKey;
  readonly decimals: BN;
  readonly tokenProgram: PublicKey;
  readonly padding: Array<BN>;

  constructor(fields: TokenInfoFields) {
    this.mint = fields.mint;
    this.decimals = fields.decimals;
    this.tokenProgram = fields.tokenProgram;
    this.padding = fields.padding;
  }

  static layout(property?: string) {
    return borsh.struct(
      [
        borsh.publicKey("mint"),
        borsh.u64("decimals"),
        borsh.publicKey("tokenProgram"),
        borsh.array(borsh.u64(), 6, "padding"),
      ],
      property,
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static fromDecoded(obj: any) {
    return new TokenInfo({
      mint: obj.mint,
      decimals: obj.decimals,
      tokenProgram: obj.tokenProgram,
      padding: obj.padding,
    });
  }

  static toEncodable(fields: TokenInfoFields) {
    return {
      mint: fields.mint,
      decimals: fields.decimals,
      tokenProgram: fields.tokenProgram,
      padding: fields.padding,
    };
  }

  toJSON(): TokenInfoJSON {
    return {
      mint: this.mint.toString(),
      decimals: this.decimals.toString(),
      tokenProgram: this.tokenProgram.toString(),
      padding: this.padding.map((item) => item.toString()),
    };
  }

  static fromJSON(obj: TokenInfoJSON): TokenInfo {
    return new TokenInfo({
      mint: new PublicKey(obj.mint),
      decimals: new BN(obj.decimals),
      tokenProgram: new PublicKey(obj.tokenProgram),
      padding: obj.padding.map((item) => new BN(item)),
    });
  }

  toEncodable() {
    return TokenInfo.toEncodable(this);
  }
}
