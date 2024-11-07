import {
  ConnectionConfig,
  Keypair,
  PublicKey,
  TransactionInstruction,
} from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import {
  collToLamportsDecimal,
  createMint,
  getFarmAuthorityPDA,
  getFarmsProgramId,
  getFarmVaultPDA,
  getRewardVaultPDA,
  getTreasuryAuthorityPDA,
  getTreasuryVaultPDA,
  getUserStatePDA,
  GlobalConfigAccounts,
  mintTo,
  setupAta,
  solAirdrop,
  createGlobalConfigPublicKeyRentExempt,
  sleep,
} from "./utils";
import Decimal from "decimal.js";
import { getMintDecimals } from "@project-serum/serum/lib/market";
import {
  Cluster,
  FarmsIdl,
  UserAccounts,
  FarmAccounts,
  parseKeypairFile,
} from "./utils";
import { FarmState } from "../rpc_client/accounts";
import { Farms } from "../Farms";
import { FarmConfigOption } from "../rpc_client/types";
import { Chain, Web3Client } from "./sendTransactionsUtils";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

export const SIZE_GLOBAL_CONFIG = 2136;
export const SIZE_FARM_STATE = 8336;
const MAINNET_BETA_CHAIN_ID = 101;
const LOCALNET_CHAIN_ID = 102;

export type Env = {
  provider: anchor.AnchorProvider;
  program: anchor.Program;
  initialOwner: Keypair;
  cluster: Cluster;
  web3Client: Web3Client;
};

export type Config = {
  strategyInfos: FarmInfo[];
};

export type FarmInfo = {
  address: PublicKey;
  owner: PublicKey;
  baseVaultAuthority: PublicKey;

  pool: PublicKey;
  globalConfig: PublicKey;

  tokenAMint: PublicKey;
  tokenAVault: PublicKey;
  tokenAVaultBump: number;

  tokenBMint: PublicKey;
  tokenBVault: PublicKey;
  tokenBVaultBump: number;

  sharesMint: PublicKey;
  sharesMintAuthority: PublicKey;
  sharesMintAuthorityBump: number;

  poolProgramId: PublicKey;
  yvaultsProgramId: PublicKey;
};

export function setUpProgram(args: {
  clusterOverride?: string;
  adminFilePath?: string;
  programOverride?: PublicKey;
}): Env {
  // Cluster & admin
  if (!args.clusterOverride) {
    throw new Error("Cluster is required");
  }
  if (!args.adminFilePath) {
    throw new Error("Admin is required");
  }

  const cluster = args.clusterOverride;

  let chain: Chain;

  if (cluster === "localnet") {
    chain = {
      name: "localnet",
      endpoint: "http://127.0.0.1:8899",
      chainID: LOCALNET_CHAIN_ID,
      displayName: "Localnet",
    };
  } else {
    chain = {
      name: "mainnet-beta",
      endpoint: cluster,
      wsEndpoint: cluster?.replace("https:", "wss:") + "/whirligig",
      chainID: MAINNET_BETA_CHAIN_ID,
      displayName: "Mainnet Beta (Triton)",
    };
  }

  const client = new Web3Client(chain);
  const connection = client.sendConnection;

  const payer = parseKeypairFile(args.adminFilePath);
  // @ts-ignore
  const wallet = new anchor.Wallet(payer);
  const provider = new anchor.AnchorProvider(
    connection,
    wallet,
    anchor.AnchorProvider.defaultOptions(),
  );
  const initialOwner = payer;
  anchor.setProvider(provider);

  // Programs
  const farmsProgramId = args.programOverride || getFarmsProgramId(cluster);
  const program = new anchor.Program(FarmsIdl, farmsProgramId);

  return {
    initialOwner,
    provider,
    program,
    cluster: cluster as Cluster,
    web3Client: client,
  };
}

export async function createGlobalAccountsWithAirdrop(
  env: Env,
  owner: Keypair = env.initialOwner,
  rewardTokens: Array<PublicKey>,
): Promise<GlobalConfigAccounts> {
  const globalConfig: Keypair = Keypair.generate();

  let rewardAtas = new Array<PublicKey>();
  let treasuryVaults = new Array<PublicKey>();
  for (let index = 0; index < rewardTokens.length; index++) {
    rewardAtas.push(await setupAta(env.provider, rewardTokens[index], owner));
    treasuryVaults.push(
      await getTreasuryVaultPDA(
        env.program.programId,
        globalConfig.publicKey,
        rewardTokens[index],
      ),
    );
  }
  let treasuryVaultAuthority = await getTreasuryAuthorityPDA(
    env.program.programId,
    globalConfig.publicKey,
  );

  const globalAccounts: GlobalConfigAccounts = {
    globalAdmin: owner,
    globalConfig,
    treasuryVaults,
    globalAdminRewardAtas: rewardAtas,
    treasuryVaultAuthority,
  };

  return globalAccounts;
}

export async function createGlobalAccounts(
  env: Env,
  owner: Keypair = env.initialOwner,
): Promise<GlobalConfigAccounts> {
  let bufferSpaceZeroAccount = 0;

  const globalConfig: Keypair = await createGlobalConfigPublicKeyRentExempt(
    env.provider,
    env.program.programId,
  );

  let rewardAtas = new Array<PublicKey>();
  let treasuryVaults = new Array<PublicKey>();
  let treasuryVaultAuthority = await getTreasuryAuthorityPDA(
    env.program.programId,
    globalConfig.publicKey,
  );

  const globalAccounts: GlobalConfigAccounts = {
    globalAdmin: owner,
    globalConfig,
    treasuryVaults,
    globalAdminRewardAtas: rewardAtas,
    treasuryVaultAuthority,
  };

  return globalAccounts;
}

export async function setUpGlobalConfigWithAirdrop(
  env: Env,
  owner: Keypair = env.initialOwner,
  rewardTokens: Array<PublicKey>,
): Promise<GlobalConfigAccounts> {
  const globalAccounts = await createGlobalAccountsWithAirdrop(
    env,
    owner,
    rewardTokens,
  );

  const farmClient = new Farms(env.provider.connection);
  await farmClient.createGlobalConfig(
    globalAccounts.globalAdmin,
    globalAccounts.globalConfig,
    0,
  );

  return globalAccounts;
}

export async function setUpGlobalConfig(
  env: Env,
  owner: Keypair = env.initialOwner,
): Promise<GlobalConfigAccounts> {
  const globalAccounts = await createGlobalAccounts(env, owner);

  const farmClient = new Farms(env.provider.connection);
  await farmClient.createGlobalConfig(
    globalAccounts.globalAdmin,
    globalAccounts.globalConfig,
    0,
  );

  return globalAccounts;
}

export async function createUser(
  env: Env,
  farmAccounts: FarmAccounts,
  solAirdropAmount: Decimal,
  tokenAirdropAmount: Decimal,
  owner?: Keypair,
): Promise<UserAccounts> {
  if (!owner) {
    owner = new anchor.web3.Keypair();
  }

  const userState = getUserStatePDA(
    env.program.programId,
    farmAccounts.farmState.publicKey,
    owner.publicKey,
  );

  if (solAirdropAmount.gt(0)) {
    await solAirdrop(env.provider, owner.publicKey, solAirdropAmount);
    await sleep(1000);
  }

  let farmState = await FarmState.fetch(
    env.provider.connection,
    farmAccounts.farmState.publicKey,
  );

  if (!farmState) {
    throw new Error("Farm state not found");
  }

  const tokenAta = await setupAta(env.provider, farmState.token.mint, owner);
  let rewardAtas = new Array<PublicKey>();
  for (let index = 0; index < farmState.numRewardTokens.toNumber(); index++) {
    rewardAtas.push(
      await setupAta(
        env.provider,
        farmState.rewardInfos[index].token.mint,
        owner,
      ),
    );
  }

  await sleep(2000);
  if (tokenAirdropAmount.gt(0)) {
    await mintTo(
      env.provider,
      farmState.token.mint,
      tokenAta,
      collToLamportsDecimal(
        tokenAirdropAmount,
        farmState.token.decimals.toNumber(),
      ).toNumber(),
    );
  }

  const testingUser: UserAccounts = {
    owner,
    userState: userState,
    tokenAta,
    rewardAtas,
  };

  return testingUser;
}

export async function setUpUser(
  env: Env,
  farmAccounts: FarmAccounts,
  rewardTokens: Array<PublicKey>,
  owner?: Keypair,
): Promise<UserAccounts> {
  if (!owner) {
    owner = new anchor.web3.Keypair();
  }

  const solAirdropAmount = new Decimal(5);
  const tokenAirdropAmount = new Decimal(2000000);

  const userAccounts = await createUser(
    env,
    farmAccounts,
    solAirdropAmount,
    tokenAirdropAmount,
    owner,
  );

  const farmClient = new Farms(env.provider.connection);

  await farmClient.createNewUser(
    userAccounts.owner,
    farmAccounts.farmState.publicKey,
    0,
  );

  return userAccounts;
}

export async function createFarmAccountsWithAirdrops(
  env: Env,
  rewardTokens: Array<PublicKey>,
  tokenMint: PublicKey,
  solAirdropAmount: Decimal,
  rewardAirdropAmounts: Array<Decimal>,
  farmAdmin?: Keypair,
): Promise<FarmAccounts> {
  if (!farmAdmin) {
    farmAdmin = new anchor.web3.Keypair();
  }

  const farmState: Keypair = Keypair.generate();

  if (solAirdropAmount.gt(0)) {
    await solAirdrop(env.provider, farmAdmin.publicKey, solAirdropAmount);
    await sleep(1000);
  }

  const farmVault = await getFarmVaultPDA(
    env.program.programId,
    farmState.publicKey,
    tokenMint,
  );
  const farmVaultAuthority = await getFarmAuthorityPDA(
    env.program.programId,
    farmState.publicKey,
  );

  let rewardVaults = new Array<PublicKey>();
  let adminRewardAtas = new Array<PublicKey>();
  for (let index = 0; index < rewardTokens.length; index++) {
    rewardVaults.push(
      await getRewardVaultPDA(
        env.program.programId,
        farmState.publicKey,
        rewardTokens[index],
      ),
    );
    adminRewardAtas.push(
      await setupAta(env.provider, rewardTokens[index], farmAdmin),
    );
  }

  await sleep(2000);

  for (let index = 0; index < rewardTokens.length; index++) {
    let tokenDecimals = await getMintDecimals(
      env.provider.connection,
      rewardTokens[index],
    );

    if (rewardAirdropAmounts[index].gt(0)) {
      await mintTo(
        env.provider,
        rewardTokens[index],
        adminRewardAtas[index],
        collToLamportsDecimal(
          rewardAirdropAmounts[index],
          tokenDecimals,
        ).toNumber(),
      );
    }
  }

  let farmAccounts: FarmAccounts = {
    farmAdmin: farmAdmin,
    farmState: farmState,
    tokenMint,
    farmVault,
    rewardVaults,
    farmVaultAuthority,
    rewardMints: rewardTokens,
    adminRewardAtas,
  };

  return farmAccounts;
}

export async function createFarmAccounts(
  env: Env,
  rewardTokens: Array<PublicKey>,
  tokenMint: PublicKey,
  farmAdmin: Keypair,
): Promise<FarmAccounts> {
  const farmState: Keypair = Keypair.generate();

  const farmVault = getFarmVaultPDA(
    env.program.programId,
    farmState.publicKey,
    tokenMint,
  );
  const farmVaultAuthority = getFarmAuthorityPDA(
    env.program.programId,
    farmState.publicKey,
  );

  let rewardVaults = new Array<PublicKey>();
  let adminRewardAtas = new Array<PublicKey>();

  let farmAccounts: FarmAccounts = {
    farmAdmin: farmAdmin,
    farmState: farmState,
    tokenMint,
    farmVault,
    rewardVaults,
    farmVaultAuthority,
    rewardMints: rewardTokens,
    adminRewardAtas,
  };

  return farmAccounts;
}

export function createDelegatedFarmAccounts(
  env: Env,
  rewardTokens: Array<PublicKey>,
  farmAdmin: Keypair,
): FarmAccounts {
  const farmState: Keypair = Keypair.generate();

  const farmVaultAuthority = getFarmAuthorityPDA(
    env.program.programId,
    farmState.publicKey,
  );

  let rewardVaults = new Array<PublicKey>();
  let adminRewardAtas = new Array<PublicKey>();

  let farmAccounts: FarmAccounts = {
    farmAdmin: farmAdmin,
    farmState: farmState,
    tokenMint: PublicKey.default,
    farmVault: PublicKey.default,
    rewardVaults,
    farmVaultAuthority,
    rewardMints: rewardTokens,
    adminRewardAtas,
  };

  return farmAccounts;
}

export async function setUpFarmWithAirdrops(
  env: Env,
  globalAccounts: GlobalConfigAccounts,
  rewardTokens: Array<PublicKey>,
  farmAdmin?: Keypair,
  tokenMint?: PublicKey,
): Promise<FarmAccounts> {
  if (!farmAdmin) {
    farmAdmin = new anchor.web3.Keypair();
  }

  const solAirdropAmount = new Decimal(5);
  let rewardAirdropAmounts = new Array<Decimal>(rewardTokens.length);
  rewardAirdropAmounts.fill(new Decimal(10000));

  if (!tokenMint) {
    tokenMint = await createMint(env.provider, env.initialOwner.publicKey);
  }

  const farmAccounts = await createFarmAccountsWithAirdrops(
    env,
    rewardTokens,
    tokenMint,
    solAirdropAmount,
    rewardAirdropAmounts,
  );

  const farmClient = new Farms(env.provider.connection);

  await farmClient.createFarm(
    farmAccounts.farmAdmin,
    globalAccounts.globalConfig.publicKey,
    farmAccounts.farmState,
    tokenMint,
    "execute",
    0,
  );

  return farmAccounts;
}

export async function setUpFarm(
  env: Env,
  globalConfig: PublicKey,
  tokenMint: PublicKey,
  farmAdmin: Keypair,
  mode: string,
  priorityFeeMultiplier: number,
): Promise<FarmAccounts> {
  let rewardTokens = new Array<PublicKey>();
  const farmAccounts = await createFarmAccounts(
    env,
    rewardTokens,
    tokenMint,
    farmAdmin,
  );

  const farmClient = new Farms(env.provider.connection);

  await farmClient.createFarm(
    farmAccounts.farmAdmin,
    globalConfig,
    farmAccounts.farmState,
    tokenMint,
    mode,
    priorityFeeMultiplier,
    env.web3Client,
  );

  return farmAccounts;
}

export async function setUpFarmDelegated(
  env: Env,
  globalConfig: PublicKey,
  farmAdmin: Keypair,
  farmDelegate: Keypair,
  mode: string,
  priorityFeeMultiplier: number,
): Promise<FarmAccounts> {
  let rewardTokens = new Array<PublicKey>();
  const farmAccounts = createDelegatedFarmAccounts(
    env,
    rewardTokens,
    farmAdmin,
  );

  const farmClient = new Farms(env.provider.connection);

  await farmClient.createFarmDelegated(
    farmAccounts.farmAdmin,
    globalConfig,
    farmAccounts.farmState,
    farmDelegate,
    mode,
    priorityFeeMultiplier,
  );

  return farmAccounts;
}

export async function setUpFarmIx(
  env: Env,
  globalConfig: PublicKey,
  tokenMint: PublicKey,
  farmAdmin: Keypair,
  mode: string,
): Promise<[TransactionInstruction[], FarmAccounts]> {
  let rewardTokens = new Array<PublicKey>();
  const farmAccounts = await createFarmAccounts(
    env,
    rewardTokens,
    tokenMint,
    farmAdmin,
  );

  const farmClient = new Farms(env.provider.connection);

  return [
    await farmClient.createFarmIx(
      mode === "multisig"
        ? new PublicKey(process.env.MULTISIG!)
        : farmAccounts.farmAdmin.publicKey,
      farmAccounts.farmState,
      globalConfig,
      tokenMint,
    ),
    farmAccounts,
  ];
}

export async function setupFarmsEnvironment(
  env: Env,
  numRewardTokens: number,
  minClaimDurationSeconds: number = 60,
  rewardRps: number = 50,
) {
  let rewardTokens = Array<PublicKey>();

  for (let i = 0; i < numRewardTokens; i++) {
    rewardTokens.push(
      await createMint(env.provider, env.initialOwner.publicKey),
    );
  }
  const globalAccounts = await setUpGlobalConfigWithAirdrop(
    env,
    env.initialOwner,
    rewardTokens,
  );

  const farmAccounts = await setUpFarmWithAirdrops(
    env,
    globalAccounts,
    rewardTokens,
  );

  const farmsClient = new Farms(env.provider.connection);

  for (let i = 0; i < numRewardTokens; i++) {
    await farmsClient.addRewardToFarm(
      farmAccounts.farmAdmin,
      globalAccounts.globalConfig.publicKey,
      farmAccounts.farmState.publicKey,
      rewardTokens[i],
      TOKEN_PROGRAM_ID,
      "execute",
      0,
    );
  }

  for (let i = 0; i < numRewardTokens; i++) {
    await farmsClient.addRewardAmountToFarm(
      farmAccounts.farmAdmin,
      farmAccounts.farmState.publicKey,
      rewardTokens[i],
      new Decimal(100),
      "execute",
      0,
    );
  }

  for (let i = 0; i < numRewardTokens; i++) {
    await farmsClient.updateFarmConfig(
      farmAccounts.farmAdmin,
      farmAccounts.farmState.publicKey,
      rewardTokens[i],
      new FarmConfigOption.UpdateRewardRps(),
      rewardRps,
      "execute",
      0,
    );
    await farmsClient.updateFarmConfig(
      farmAccounts.farmAdmin,
      farmAccounts.farmState.publicKey,
      rewardTokens[i],
      new FarmConfigOption.UpdateRewardMinClaimDuration(),
      minClaimDurationSeconds,
      "execute",
      0,
    );
  }

  const userAccounts = await setUpUser(env, farmAccounts, rewardTokens);

  return {
    farmsClient,
    farmAccounts,
    globalAccounts,
    userAccounts,
    rewardTokens,
  };
}
