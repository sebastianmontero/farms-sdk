import * as anchor from "@coral-xyz/anchor";
import * as fs from "fs";
import * as FarmsErrors from "../rpc_client/errors";
import { TokenInstructions } from "@project-serum/serum";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
  Connection,
  Keypair,
  PublicKey,
  TransactionInstruction,
  Transaction,
  Signer,
  SystemProgram,
} from "@solana/web3.js";
import { Decimal } from "decimal.js";
import { ASSOCIATED_TOKEN_PROGRAM_ID, Token } from "@solana/spl-token";
import * as web3 from "@solana/web3.js";
import { Env, SIZE_GLOBAL_CONFIG, SIZE_FARM_STATE } from "./setup";
import { GlobalConfig, UserState, FarmState } from "../rpc_client/accounts";
import FARMS_IDL from "../rpc_client/farms.json";
import { farmsId } from "../Farms";
import { createAddExtraComputeUnitFeeTransaction } from "../commands/utils";

export const FarmsIdl = FARMS_IDL as anchor.Idl;
export const WAD = new Decimal("1".concat(Array(18 + 1).join("0")));

export function parseKeypairFile(file: string): Keypair {
  return Keypair.fromSecretKey(
    Buffer.from(JSON.parse(require("fs").readFileSync(file))),
  );
}

export function collToLamportsDecimal(
  amount: Decimal,
  decimals: number,
): Decimal {
  let factor = Math.pow(10, decimals);
  return amount.mul(factor);
}
export function lamportsToCollDecimal(
  amount: Decimal,
  decimals: number,
): Decimal {
  let factor = Math.pow(10, decimals);
  return amount.div(factor);
}

export interface GlobalConfigAccounts {
  globalAdmin: Keypair;
  globalConfig: Keypair;
  treasuryVaults: Array<PublicKey>;
  treasuryVaultAuthority: PublicKey;
  globalAdminRewardAtas: Array<PublicKey>;
}

export interface FarmAccounts {
  farmAdmin: Keypair;
  farmState: Keypair;
  tokenMint: PublicKey;
  farmVault: PublicKey;
  rewardVaults: Array<PublicKey>;
  farmVaultAuthority: PublicKey;
  rewardMints: Array<PublicKey>;
  adminRewardAtas: Array<PublicKey>;
}

export interface UserAccounts {
  owner: Keypair;
  userState: PublicKey;
  tokenAta: PublicKey;
  rewardAtas: Array<PublicKey>;
}

export async function createMint(
  provider: anchor.AnchorProvider,
  authority: PublicKey,
  decimals: number = 6,
): Promise<PublicKey> {
  const mint = anchor.web3.Keypair.generate();
  return await createMintFromKeypair(provider, authority, mint, decimals);
}

export async function createMintFromKeypair(
  provider: anchor.AnchorProvider,
  authority: PublicKey,
  mint: Keypair,
  decimals: number = 6,
): Promise<PublicKey> {
  const instructions = await createMintInstructions(
    provider,
    authority,
    mint.publicKey,
    decimals,
  );

  const tx = new anchor.web3.Transaction();
  tx.add(...instructions);

  await provider.sendAndConfirm(tx, [mint]);
  return mint.publicKey;
}

async function createMintInstructions(
  provider: anchor.AnchorProvider,
  authority: PublicKey,
  mint: PublicKey,
  decimals: number,
): Promise<TransactionInstruction[]> {
  return [
    anchor.web3.SystemProgram.createAccount({
      fromPubkey: provider.wallet.publicKey,
      newAccountPubkey: mint,
      space: 82,
      lamports: await provider.connection.getMinimumBalanceForRentExemption(82),
      programId: TOKEN_PROGRAM_ID,
    }),
    TokenInstructions.initializeMint({
      mint,
      decimals,
      mintAuthority: authority,
    }),
  ];
}

export async function solAirdrop(
  provider: anchor.AnchorProvider,
  account: PublicKey,
  solAirdrop: Decimal,
): Promise<Decimal> {
  const airdropTxnId = await provider.connection.requestAirdrop(
    account,
    collToLamportsDecimal(solAirdrop, 9).toNumber(),
  );
  await provider.connection.confirmTransaction(airdropTxnId);
  return await getSolBalance(provider, account);
}

export async function solAirdropMin(
  provider: anchor.AnchorProvider,
  account: PublicKey,
  minSolAirdrop: Decimal,
): Promise<Decimal> {
  const airdropBatchAmount = Decimal.max(50, minSolAirdrop);
  let currentBalance = await getSolBalance(provider, account);
  while (currentBalance.lt(minSolAirdrop)) {
    try {
      await provider.connection.requestAirdrop(
        account,
        collToLamportsDecimal(airdropBatchAmount, 9).toNumber(),
      );
    } catch (e) {
      await sleep(100);
      console.log("Error", e);
    }
    await sleep(100);
    currentBalance = await getSolBalance(provider, account);
  }
  return currentBalance;
}

export async function checkIfAccountExists(
  connection: Connection,
  account: PublicKey,
): Promise<boolean> {
  return (await connection.getAccountInfo(account)) != null;
}

export async function getAssociatedTokenAddress(
  owner: PublicKey,
  tokenMintAddress: PublicKey,
  tokenProgram: PublicKey,
): Promise<PublicKey> {
  return await Token.getAssociatedTokenAddress(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    tokenProgram,
    tokenMintAddress,
    owner,
    true,
  );
}

export async function createAssociatedTokenAccountIdempotentInstruction(
  owner: PublicKey,
  mint: PublicKey,
  payer: PublicKey = owner,
  tokenProgram: PublicKey,
  ata?: PublicKey,
): Promise<[PublicKey, TransactionInstruction]> {
  let ataAddress = ata;
  if (!ataAddress) {
    ataAddress = await getAssociatedTokenAddress(owner, mint, tokenProgram);
  }
  const createUserTokenAccountIx =
    Token.createAssociatedTokenAccountInstruction(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      tokenProgram,
      mint,
      ataAddress,
      owner,
      payer,
    );
  // idempotent ix discriminator is 1
  createUserTokenAccountIx.data = Buffer.from([1]);
  return [ataAddress, createUserTokenAccountIx];
}

export async function setupAta(
  provider: anchor.AnchorProvider,
  tokenMintAddress: PublicKey,
  user: Keypair,
): Promise<PublicKey> {
  const ata = await getAssociatedTokenAddress(
    user.publicKey,
    tokenMintAddress,
    TOKEN_PROGRAM_ID,
  );
  if (!(await checkIfAccountExists(provider.connection, ata))) {
    const [, ix] = await createAssociatedTokenAccountIdempotentInstruction(
      user.publicKey,
      tokenMintAddress,
      user.publicKey,
      TOKEN_PROGRAM_ID,
      ata,
    );
    const tx = new Transaction().add(ix);
    await provider.connection.sendTransaction(tx, [user]);
  }
  return ata;
}

export async function mintTo(
  provider: anchor.AnchorProvider,
  mintPubkey: PublicKey,
  tokenAccount: PublicKey,
  amount: number,
) {
  const tx = new Transaction().add(
    Token.createMintToInstruction(
      TOKEN_PROGRAM_ID, // always TOKEN_PROGRAM_ID
      mintPubkey, // mint
      tokenAccount, // receiver (sholud be a token account)
      provider.wallet.publicKey, // mint authority
      [], // only multisig account will use. leave it empty now.
      amount, // amount. if your decimals is 8, you mint 10^8 for 1 token.
    ),
  );

  const microLamport = 10 ** 6; // 1 lamport
  const computeUnits = 200_000;
  const microLamportsPrioritizationFee = microLamport / computeUnits;

  const priorityFeeIxn = createAddExtraComputeUnitFeeTransaction(
    computeUnits,
    microLamportsPrioritizationFee * 5,
  );
  tx.add(...priorityFeeIxn);

  await provider.sendAndConfirm(tx);
}

export async function transferToken(
  provider: anchor.AnchorProvider,
  fromAccount: Signer,
  fromTokenAccount: PublicKey,
  toTokenAccount: PublicKey,
  amount: number,
) {
  let tx = new Transaction().add(
    Token.createTransferInstruction(
      TOKEN_PROGRAM_ID,
      fromTokenAccount,
      toTokenAccount,
      fromAccount.publicKey,
      [],
      amount,
    ),
  );
  await web3.sendAndConfirmTransaction(provider.connection, tx, [fromAccount]);
  await sleep(500);
}

/**
 * Get the custom program error code if there's any in the error message and return parsed error code hex to number string
 * @param errMessage string - error message that would contain the word "custom program error:" if it's a customer program error
 * @returns [boolean, string] - probably not a custom program error if false otherwise the second element will be the code number in string
 */
export const getCustomProgramErrorCode = (
  errMessage: string,
): [boolean, string] => {
  const index = errMessage.indexOf("Custom program error:");
  if (index === -1) {
    return [false, "May not be a custom program error"];
  } else {
    return [
      true,
      `${parseInt(
        errMessage.substring(index + 22, index + 28).replace(" ", ""),
        16,
      )}`,
    ];
  }
};

/**
 *
 * Maps the private Anchor type ProgramError to a normal Error.
 * Pass ProgramErr.msg as the Error message so that it can be used with chai matchers
 *
 * @param fn - function which may throw an anchor ProgramError
 */
export async function mapAnchorError<T>(fn: Promise<T>): Promise<T> {
  try {
    return await fn;
  } catch (e: any) {
    let [isCustomProgramError, errorCode] = getCustomProgramErrorCode(
      JSON.stringify(e),
    );
    if (isCustomProgramError) {
      let error: any;
      if (!![Number(errorCode)]) {
        error = FarmsErrors.fromCode(Number(errorCode));
        throw new Error(error);
      } else if (Number(errorCode) >= 6000 && Number(errorCode) <= 7000) {
        errorCode[errorCode.length - 2] === "0"
          ? (errorCode = errorCode.slice(-1))
          : (errorCode = errorCode.slice(-2));
        // @ts-ignore
        error = FarmsIdl.errors![errorCode].msg;
        throw new Error(error);
      } else {
        throw new Error(e);
      }
    }
    throw e;
  }
}

export async function getTokenAccountBalance(
  provider: anchor.AnchorProvider,
  tokenAccount: PublicKey,
): Promise<Decimal> {
  const tokenAccountBalance =
    await provider.connection.getTokenAccountBalance(tokenAccount);
  return new Decimal(tokenAccountBalance.value.amount).div(
    Decimal.pow(10, tokenAccountBalance.value.decimals),
  );
}

export async function getSolBalanceInLamports(
  provider: anchor.AnchorProvider,
  account: PublicKey,
): Promise<number> {
  let balance: number | undefined = undefined;
  while (balance === undefined) {
    balance = (await provider.connection.getAccountInfo(account))?.lamports;
  }
  return balance;
}

export async function getSolBalance(
  provider: anchor.AnchorProvider,
  account: PublicKey,
): Promise<Decimal> {
  const balance = new Decimal(await getSolBalanceInLamports(provider, account));
  return lamportsToCollDecimal(balance, 9);
}

export type Cluster = "localnet" | "devnet" | "mainnet";
export type SolEnv = {
  cluster: Cluster;
  ownerKeypairPath: string;
  endpoint: string;
};

export function getFarmsProgramId(cluster: string) {
  return new PublicKey("FarmsPZpWu9i7Kky8tPN37rs2TpmMrAZrC7S7vJa91Hr");
}

export function endpointFromCluster(cluster: string | undefined): string {
  switch (cluster) {
    case "mainnet":
      return "https://hubble-dedi.rpcpool.com/98e7842fbc63114f80adf2810a80";
    case "devnet":
      return "https://hubblep-develope-bbc5.devnet.rpcpool.com/5849b35e-9963-46d9-b1d9-3c09dd4f6bdd";
    case "localnet":
      return "http://127.0.0.1:8899";
  }

  if (cluster) {
    return cluster;
  }

  return "err";
}

export function pubkeyFromFile(filepath: string): PublicKey {
  const fileContents = fs.readFileSync(filepath, "utf8");
  const privateArray = fileContents
    .replace("[", "")
    .replace("]", "")
    .split(",")
    .map(function (item) {
      return parseInt(item, 10);
    });
  const array = Uint8Array.from(privateArray);
  const keypair = Keypair.fromSecretKey(array);
  return keypair.publicKey;
}

export function createAddExtraComputeUnitsTransaction(
  owner: PublicKey,
  units: number,
): TransactionInstruction {
  return web3.ComputeBudgetProgram.setComputeUnitLimit({ units });
}
export function u16ToBytes(num: number) {
  const arr = new ArrayBuffer(2);
  const view = new DataView(arr);
  view.setUint16(0, num, false);
  return new Uint8Array(arr);
}

export async function accountExist(
  connection: anchor.web3.Connection,
  account: anchor.web3.PublicKey,
) {
  const info = await connection.getAccountInfo(account);
  if (info === null || info.data.length === 0) {
    return false;
  }
  return true;
}

export async function fetchFarmStateWithRetry(
  env: Env,
  address: PublicKey,
): Promise<FarmState | null> {
  return fetchWithRetry(
    async () => await FarmState.fetch(env.provider.connection, address),
    address,
  );
}

export async function fetchGlobalConfigWithRetry(
  env: Env,
  address: PublicKey,
): Promise<GlobalConfig> {
  return fetchWithRetry(
    async () => await GlobalConfig.fetch(env.provider.connection, address),
    address,
  );
}

export async function fetchUserStateWithRetry(
  env: Env,
  address: PublicKey,
): Promise<UserState> {
  return fetchWithRetry(
    async () => await UserState.fetch(env.provider.connection, address),
    address,
  );
}

export function getTreasuryVaultPDA(
  programId: PublicKey,
  globalConfig: PublicKey,
  rewardMint: PublicKey,
): PublicKey {
  const [treasuryVault, _rewardTreasuryVaultBump] =
    anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("tvault"), globalConfig.toBuffer(), rewardMint.toBuffer()],
      programId,
    );

  return treasuryVault;
}

export function getTreasuryAuthorityPDA(
  programId: PublicKey,
  globalConfig: PublicKey,
): PublicKey {
  const [treasuryAuthority, _treasuryAuthorityBump] =
    anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("authority"), globalConfig.toBuffer()],
      programId,
    );

  return treasuryAuthority;
}

export function getFarmAuthorityPDA(
  programId: PublicKey,
  farmState: PublicKey,
): PublicKey {
  const [farmAuthority, _farmAuthorityBump] =
    anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("authority"), farmState.toBuffer()],
      programId,
    );

  return farmAuthority;
}

export function getFarmVaultPDA(
  programId: PublicKey,
  farmState: PublicKey,
  tokenMint: PublicKey,
): PublicKey {
  const [farmVault, _farmVaultBump] =
    anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("fvault"), farmState.toBuffer(), tokenMint.toBuffer()],
      programId,
    );

  return farmVault;
}

export function getRewardVaultPDA(
  programId: PublicKey,
  farmState: PublicKey,
  rewardMint: PublicKey,
): PublicKey {
  const [rewardVault, _rewardVaultBump] =
    anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("rvault"), farmState.toBuffer(), rewardMint.toBuffer()],
      programId,
    );

  return rewardVault;
}

export function getUserStatePDA(
  programId: PublicKey,
  farmState: PublicKey,
  owner: PublicKey,
): PublicKey {
  const [userState, _userStateBump] =
    anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("user"), farmState.toBuffer(), owner.toBuffer()],
      programId,
    );

  return userState;
}

async function fetchWithRetry(
  fetch: () => Promise<any>,
  address: PublicKey,
  retries: number = 3,
) {
  for (let i = 0; i < retries; i++) {
    let resp = await fetch();
    if (resp !== null) {
      return resp;
    }
    console.log(
      `[${i + 1}/${retries}] Fetched account ${address} is null. Refetching...`,
    );
  }
  return null;
}

export async function sendAndConfirmInstructions(
  env: Env,
  ixns: [TransactionInstruction],
): Promise<web3.TransactionSignature> {
  let tx = new Transaction();
  for (let i = 0; i < ixns.length; i++) {
    tx.add(ixns[i]);
  }
  let { blockhash } = await env.provider.connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  tx.feePayer = env.initialOwner.publicKey;

  return await web3.sendAndConfirmTransaction(env.provider.connection, tx, [
    env.initialOwner,
  ]);
}

export function getGlobalConfigValue(
  flagValueType: string,
  flagValue: string,
): number[] {
  let value: bigint | PublicKey | boolean;
  if (flagValueType === "number") {
    value = BigInt(flagValue);
  } else if (flagValueType === "bool") {
    if (flagValue === "false") {
      value = false;
    } else if (flagValue === "true") {
      value = true;
    } else {
      throw new Error("the provided flag value is not valid bool");
    }
  } else if (flagValueType === "publicKey") {
    value = new PublicKey(flagValue);
  } else {
    throw new Error("flagValueType must be 'number', 'bool', or 'publicKey'");
  }

  let buffer: Buffer;
  if (value instanceof PublicKey) {
    buffer = value.toBuffer();
  } else if (typeof value === "boolean") {
    buffer = Buffer.alloc(32);
    value ? buffer.writeUInt8(1, 0) : buffer.writeUInt8(0, 0);
  } else if (typeof value === "bigint") {
    buffer = Buffer.alloc(32);
    buffer.writeBigUInt64LE(value); // Because we send 32 bytes and a u64 has 8 bytes, we write it in LE
  } else {
    throw Error("wrong type for value");
  }
  return [...buffer];
}

export async function createKeypairRentExempt(
  provider: anchor.AnchorProvider,
  programId: PublicKey,
  address: Keypair,
  size: number,
): Promise<web3.Keypair> {
  const tx = new Transaction();
  tx.add(
    await createKeypairRentExemptIx(
      provider.connection,
      provider.wallet.publicKey,
      address,
      size,
      programId,
    ),
  );
  await provider.sendAndConfirm(tx, [address]);
  return address;
}

export async function createKeypairRentExemptIx(
  connection: Connection,
  payer: PublicKey,
  account: Keypair,
  size: number,
  programId: PublicKey = farmsId,
): Promise<TransactionInstruction> {
  return SystemProgram.createAccount({
    fromPubkey: payer,
    newAccountPubkey: account.publicKey,
    space: size,
    lamports: await connection.getMinimumBalanceForRentExemption(size),
    programId: programId,
  });
}

export async function createGlobalConfigPublicKeyRentExempt(
  provider: anchor.AnchorProvider,
  programId: PublicKey,
): Promise<Keypair> {
  const config = Keypair.generate();
  const key = await createKeypairRentExempt(
    provider,
    programId,
    config,
    SIZE_GLOBAL_CONFIG,
  );
  return key;
}

export async function createFarmPublicKeyRentExempt(
  provider: anchor.AnchorProvider,
  programId: PublicKey,
): Promise<Keypair> {
  const farm = Keypair.generate();
  const key = await createKeypairRentExempt(
    provider,
    programId,
    farm,
    SIZE_FARM_STATE,
  );
  return key;
}

export async function buildAndSendTxnWithLogs(
  c: Connection,
  tx: Transaction,
  owner: Keypair,
  signers: Signer[],
) {
  const { blockhash } = await c.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  tx.feePayer = owner.publicKey;

  try {
    const sig: string = await c.sendTransaction(tx, [owner, ...signers]);
    console.log("Transaction Hash:", sig);
    await sleep(5000);
    const res = await c.getTransaction(sig, {
      commitment: "confirmed",
    });
    console.log("Transaction Logs:\n", res!.meta!.logMessages);
  } catch (e: any) {
    console.log(e);
    await sleep(5000);
    const sig = e.toString().split(" failed ")[0].split("Transaction ")[1];
    const res = await c.getTransaction(sig, {
      commitment: "confirmed",
    });
    console.log("Txn", res!.meta!.logMessages);
  }
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function scaleDownWads(value: anchor.BN) {
  return new Decimal(value.toString()).div(WAD).toNumber();
}

export function convertStakeToAmount(
  stake: Decimal,
  totalStaked: Decimal,
  totalAmount: Decimal,
): Decimal {
  if (stake === new Decimal(0)) {
    return new Decimal(0);
  }

  if (totalStaked !== new Decimal(0)) {
    return stake.mul(totalAmount).div(totalStaked);
  } else {
    return stake.add(totalAmount);
  }
}

export function convertAmountToStake(
  amount: Decimal,
  totalStaked: Decimal,
  totalAmount: Decimal,
): Decimal {
  if (amount === new Decimal(0)) {
    return new Decimal(0);
  }

  if (totalAmount !== new Decimal(0)) {
    return totalStaked.mul(amount).div(totalAmount);
  } else {
    return amount;
  }
}

export const parseTokenSymbol = (tokenSymbol: number[]): string => {
  return String.fromCharCode(...tokenSymbol.filter((x) => x > 0));
};

export async function getMintDecimals(
  env: Env,
  mint: PublicKey,
  tokenProgram: PublicKey,
): Promise<number> {
  return (
    await new Token(
      env.provider.connection,
      mint,
      tokenProgram,
      env.initialOwner,
    ).getMintInfo()
  ).decimals;
}

export async function retryAsync(
  fn: () => Promise<any>,
  retriesLeft = 5,
  interval = 2000,
): Promise<any> {
  try {
    return await fn();
  } catch (error) {
    if (retriesLeft) {
      await new Promise((resolve) => setTimeout(resolve, interval));
      return await retryAsync(fn, retriesLeft - 1, interval);
    }
    throw error;
  }
}

export function noopProfiledFunctionExecution(
  promise: Promise<any>,
): Promise<any> {
  return promise;
}
