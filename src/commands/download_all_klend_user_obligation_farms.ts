import { KaminoMarket } from "@kamino-finance/klend-sdk";
import { PublicKey } from "@solana/web3.js";
import { initializeClient } from "./utils";
import { getFarmsProgramId } from "../utils";
import * as fs from "fs";

export async function downloadAllUserObligationsForReserve(
  market: string,
  reservePk: string,
) {
  const admin = process.env.ADMIN;
  const rpc = process.env.RPC;
  const klendProgramId = new PublicKey(process.env.KLEND_PROGRAM_ID || "");

  const env = initializeClient(rpc!, admin!, getFarmsProgramId(rpc!), false);
  const c = env.provider.connection;

  const lendingMarket = new PublicKey(market);
  const reserve = new PublicKey(reservePk);
  const kaminoMarket = await KaminoMarket.load(
    c,
    lendingMarket,
    450,
    klendProgramId,
  );

  if (!kaminoMarket) {
    throw new Error("Kamino market not found");
  }

  let obligationsGenerator = kaminoMarket.batchGetAllObligationsForMarket();

  const writeStream = fs.createWriteStream(
    `./obligations-${reserve.toString()}.json`,
  );
  writeStream.write("[\n");
  let sep = "";
  for await (const obligations of obligationsGenerator) {
    for (const obligation of obligations) {
      for (const deposit of obligation.state.deposits) {
        if (deposit.depositReserve.equals(reserve)) {
          writeStream.write(
            `${sep}"${obligation.obligationAddress.toString()}"`,
          );
          if (!sep) {
            sep = ",\n";
          }
        }
      }
    }
    continue;
  }

  writeStream.write("\n]");

  return;
}
