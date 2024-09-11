import { PublicKey } from "@solana/web3.js";
import { UserState } from "../rpc_client/accounts";

export type UserAndKey = {
  userState: UserState;
  key: PublicKey;
};
