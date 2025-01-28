import { ENV } from "@kamino-finance/klend-sdk";
import {
  Commitment,
  Connection,
  SendOptions,
  Signer,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";
import bs58 from "bs58";

export type Chain = {
  name: ENV;
  displayName: string;
  endpoint: string;
  chainID: number;
  wsEndpoint?: string;
};

export class Web3Client {
  private readonly _connection: Connection;

  private readonly _sendConnection: Connection;

  private readonly _sendConnectionsExtra: Connection[];

  private readonly _endpoint: string;

  private readonly _env: ENV;

  private readonly _chain: Chain;

  constructor(endpoint: Chain | string) {
    let chain: Chain | undefined;
    if (typeof endpoint === "string") {
      if (chain === undefined) {
        throw Error(`Invalid environment - ${endpoint}`);
      }
    } else {
      chain = endpoint;
    }

    this._chain = chain;
    this._endpoint = chain.endpoint;
    this._env = chain.name;
    // use this connection to get data
    this._connection = new Connection(this._endpoint, {
      commitment: "processed",
      wsEndpoint: chain.wsEndpoint,
      confirmTransactionInitialTimeout: 120 * 1000,
    });

    // use this one to submit transactions
    this._sendConnection = new Connection(this._endpoint, {
      commitment: "confirmed",
      wsEndpoint: chain.wsEndpoint,
      confirmTransactionInitialTimeout: 120 * 1000,
    });

    if (chain.name !== "localnet" && process.env.IRONFORGE_CLUSTER) {
      this._sendConnectionsExtra = [
        new Connection(process.env.IRONFORGE_CLUSTER!, {
          commitment: "confirmed",
          wsEndpoint: chain.wsEndpoint,
          confirmTransactionInitialTimeout: 120 * 1000,
        }),
      ];
    } else {
      this._sendConnectionsExtra = [this._sendConnection];
    }
  }

  get endpoint(): string {
    return this._endpoint;
  }

  get chain(): Chain {
    return this._chain;
  }

  get env(): ENV {
    return this._env;
  }

  get connection(): Connection {
    return this._connection;
  }

  get sendConnection(): Connection {
    return this._sendConnection;
  }

  get sendConnectionsExtra(): Connection[] {
    return this._sendConnectionsExtra;
  }
}

const RETRY_INTERVAL = 2000;

export async function signSendAndConfirmRawTransactionWithRetry({
  mainConnection,
  extraConnections = [],
  tx,
  signers,
  commitment = "confirmed",
  sendTransactionOptions,
}: {
  mainConnection: Connection;
  extraConnections?: Connection[];
  tx: VersionedTransaction;
  signers: Array<Signer>;
  commitment?: Commitment;
  sendTransactionOptions?: SendOptions;
}) {
  tx.sign(signers);
  return sendAndConfirmRawTransactionWithRetry({
    mainConnection,
    extraConnections,
    tx,
    commitment,
    sendTransactionOptions,
  });
}

export async function sendAndConfirmRawTransactionWithRetry({
  mainConnection,
  extraConnections = [],
  tx,
  commitment = "confirmed",
  sendTransactionOptions,
}: {
  mainConnection: Connection;
  extraConnections?: Connection[];
  tx: Transaction | VersionedTransaction;
  commitment?: Commitment;
  sendTransactionOptions?: SendOptions;
}) {
  const signature = isVersionedTransaction(tx)
    ? bs58.encode(tx.signatures[0])
    : tx.signatures?.toString();
  console.log("Signature attempted: ", signature);
  let intervalId: NodeJS.Timer;
  let confirmed = false;
  const serialized = Buffer.from(tx.serialize());
  const latestBlockHashAndContext =
    await mainConnection.getLatestBlockhashAndContext(commitment);
  const defaultOptions: SendOptions = {
    skipPreflight: true,
    maxRetries: 0,
    preflightCommitment: commitment,
  };

  if (!signature) {
    throw new Error(
      "Transaction is not signed. Refresh the page and try again",
    );
  }

  // Listen for transaction confirmation
  const waitForConfirmation = async (sig: string) => {
    try {
      const res = await mainConnection.confirmTransaction(
        {
          blockhash: latestBlockHashAndContext.value.blockhash,
          lastValidBlockHeight:
            latestBlockHashAndContext.value.lastValidBlockHeight,
          signature: sig,
        },
        commitment,
      );
      confirmed = true;

      return res;
    } catch (error) {
      console.log(error);
      return null;
    }
  };

  // Send transaction and set interval to resend every X seconds
  const sendTransaction = () => {
    if (confirmed) {
      return;
    }
    try {
      mainConnection.sendRawTransaction(serialized, {
        ...defaultOptions,
        ...sendTransactionOptions,
      });

      extraConnections.forEach((conn) => {
        conn.sendRawTransaction(serialized, {
          ...defaultOptions,
          ...sendTransactionOptions,
        });
      });
    } catch (error) {
      console.log(error);
    }
  };

  sendTransaction();
  intervalId = setInterval(() => {
    sendTransaction();
  }, RETRY_INTERVAL);

  const res = await waitForConfirmation(signature);

  if (res && res.value && res.value.err) {
    const txDetails = await mainConnection.getTransaction(signature, {
      maxSupportedTransactionVersion: 0,
      commitment: "confirmed",
    });
    if (txDetails) {
      // eslint-disable-next-line @typescript-eslint/no-throw-literal
      throw {
        err: txDetails.meta?.err,
        logs: txDetails.meta?.logMessages || [],
        signature,
        tx,
      };
    }
    // eslint-disable-next-line @typescript-eslint/no-throw-literal
    throw { err: res.value.err, msg: res.value.err, signature, tx };
  }

  return signature;
}

export function isVersionedTransaction(
  transaction: Transaction | VersionedTransaction,
): transaction is VersionedTransaction {
  return "version" in transaction;
}
