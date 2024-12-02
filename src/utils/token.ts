import {
  createMintToInstruction,
  TOKEN_PROGRAM_ID,
  unpackMint,
} from "@solana/spl-token";
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  createInitializeMint2Instruction,
  createAssociatedTokenAccountIdempotentInstruction as createAta,
  getAssociatedTokenAddress as getAta,
} from "@solana/spl-token";
import * as anchor from "@coral-xyz/anchor";
import { createAddExtraComputeUnitFeeTransaction } from "../commands/utils";
import { checkIfAccountExists } from "./utils";

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
    createInitializeMint2Instruction(
      mint,
      decimals,
      authority,
      null,
      TOKEN_PROGRAM_ID,
    ),
  ];
}

export async function getMintDecimals(
  connection: Connection,
  mintAddress: PublicKey,
): Promise<number> {
  const acc = await connection.getAccountInfo(mintAddress);
  if (!acc) {
    throw new Error(`Failed to find mint account ${mintAddress.toBase58()}`);
  }
  return unpackMint(mintAddress, acc, acc.owner).decimals;
}

export async function getAssociatedTokenAddress(
  owner: PublicKey,
  tokenMintAddress: PublicKey,
  tokenProgram: PublicKey,
): Promise<PublicKey> {
  return getAta(tokenMintAddress, owner, false, tokenProgram);
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
  const createUserTokenAccountIx = createAta(
    payer,
    ataAddress,
    owner,
    mint,
    tokenProgram,
  );
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
    createMintToInstruction(
      mintPubkey,
      tokenAccount,
      provider.wallet.publicKey,
      amount,
      [],
      TOKEN_PROGRAM_ID,
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
