import { PublicKey } from "@solana/web3.js";
import { FarmState } from "../rpc_client/accounts";

export type FarmAndKey = {
  farmState: FarmState;
  key: PublicKey;
};
