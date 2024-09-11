import { PROGRAM_ID, Reserve } from "@kamino-finance/klend-sdk";
import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import { Farms } from "../Farms";
import { FarmState } from "../rpc_client/accounts";
import { initializeClient } from "./utils";
import { getFarmsProgramId } from "../utils";

export async function refreshAllKlendUsersCommand(reserve: string) {
  const admin = process.env.ADMIN;
  const rpc = process.env.RPC;
  const klendProgramId = process.env.KLEND_PROGRAM_ID;

  const env = initializeClient(rpc!, admin!, getFarmsProgramId(rpc!), false);

  const farmsClient = new Farms(env.provider.connection);

  const reservePubkey = new PublicKey(reserve);
  const reserveState = await Reserve.fetch(
    env.provider.connection,
    reservePubkey,
    new PublicKey(klendProgramId || ""),
  );

  if (!reserveState) {
    throw new Error("Reserve not found");
  }

  const collFarm = reserveState.farmCollateral;
  const debtFarm = reserveState.farmDebt;

  const farms = [
    ["Collateral", collFarm],
    ["Debt", debtFarm],
  ];
  for (const [farmType, farm] of farms) {
    const allUserFarms = await farmsClient.getAllUserStatesForFarm(
      new PublicKey(farm),
    );

    const farmState = await FarmState.fetch(
      env.provider.connection,
      new PublicKey(farm),
    );
    if (!farmState) {
      throw new Error("Farm not found");
    }
    let scopePrices = farmState.scopePrices.equals(PublicKey.default)
      ? PROGRAM_ID
      : farmState.scopePrices;

    let ixns: TransactionInstruction[] = [];
    let numIxnsPerTxn = 20;
    for (let i = 0; i < allUserFarms.length; i++) {
      const ix = await farmsClient.refreshUserIx(
        allUserFarms[i].key,
        new PublicKey(farm),
        scopePrices,
      );
      ixns.push(ix);

      if (
        (i + 1 == allUserFarms.length && ixns.length > 0) ||
        (i > 0 && ixns.length % numIxnsPerTxn == 0 && ixns.length > 0)
      ) {
        const sig = await farmsClient.executeTransaction(
          ixns,
          env.initialOwner,
          [],
        );
        console.log(
          `${i + 1}/${
            allUserFarms.length
          } Refreshed Signature ${sig} for ${farmType}`,
        );
        ixns = [];
      }
    }
  }
}
