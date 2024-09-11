import * as Instructions from "../rpc_client/instructions";
import * as anchor from "@coral-xyz/anchor";
import { PublicKey, Keypair } from "@solana/web3.js";

import * as Types from "../rpc_client/types";
import { getGlobalConfigValue } from "./utils";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { TransactionInstruction } from "@solana/web3.js";
import { PROGRAM_ID } from "../rpc_client/programId";
import { FarmConfigOption } from "../rpc_client/types";
import { RewardCurvePoint } from "../Farms";

export function initializeGlobalConfig(
  globalAdmin: PublicKey,
  globalConfig: PublicKey,
  treasuryVaultAuthority: PublicKey,
): TransactionInstruction {
  let accounts: Instructions.InitializeGlobalConfigAccounts = {
    globalAdmin,
    globalConfig: globalConfig,
    treasuryVaultsAuthority: treasuryVaultAuthority,
    systemProgram: anchor.web3.SystemProgram.programId,
  };

  let ix = Instructions.initializeGlobalConfig(accounts);

  return ix;
}

export function updateGlobalConfig(
  globalAdmin: PublicKey,
  globalConfig: PublicKey,
  mode: Types.GlobalConfigOptionKind,
  flagValue: string,
  flagValueType: string,
): TransactionInstruction {
  let formattedValue = getGlobalConfigValue(flagValueType, flagValue);

  let accounts: Instructions.UpdateGlobalConfigAccounts = {
    globalAdmin,
    globalConfig: globalConfig,
  };

  let args: Instructions.UpdateGlobalConfigArgs = {
    mode: mode.discriminator,
    value: formattedValue,
  };

  let ix = Instructions.updateGlobalConfig(args, accounts);

  return ix;
}

export function updateGlobalConfigAdmin(
  pendingGlobalAdmin: PublicKey,
  globalConfig: PublicKey,
): TransactionInstruction {
  let accounts: Instructions.UpdateGlobalConfigAdminAccounts = {
    pendingGlobalAdmin,
    globalConfig: globalConfig,
  };

  let ix = Instructions.updateGlobalConfigAdmin(accounts);

  return ix;
}

export function updateFarmAdmin(
  pendingFarmAdmin: PublicKey,
  farm: PublicKey,
): TransactionInstruction {
  let accounts: Instructions.UpdateFarmAdminAccounts = {
    pendingFarmAdmin,
    farmState: farm,
  };

  let ix = Instructions.updateFarmAdmin(accounts);

  return ix;
}

export function initializeFarm(
  globalConfig: PublicKey,
  farmAdmin: PublicKey,
  farmState: PublicKey,
  farmVault: PublicKey,
  farmVaultAuthority: PublicKey,
  tokenMint: PublicKey,
): TransactionInstruction {
  let accounts: Instructions.InitializeFarmAccounts = {
    farmAdmin,
    farmState: farmState,
    globalConfig: globalConfig,
    farmVault: farmVault,
    farmVaultsAuthority: farmVaultAuthority,
    tokenMint: tokenMint,
    tokenProgram: TOKEN_PROGRAM_ID,
    systemProgram: anchor.web3.SystemProgram.programId,
    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
  };

  let ix = Instructions.initializeFarm(accounts);

  return ix;
}

export function initializeReward(
  globalConfig: PublicKey,
  treasuryVaultAuthority: PublicKey,
  treasuryVault: PublicKey,
  farmAdmin: PublicKey,
  farmState: PublicKey,
  rewardVault: PublicKey,
  farmVaultAuthority: PublicKey,
  rewardMint: PublicKey,
  tokenProgram: PublicKey,
): TransactionInstruction {
  let accounts: Instructions.InitializeRewardAccounts = {
    farmAdmin,
    farmState: farmState,
    globalConfig: globalConfig,
    rewardVault: rewardVault,
    farmVaultsAuthority: farmVaultAuthority,
    treasuryVaultsAuthority: treasuryVaultAuthority,
    rewardTreasuryVault: treasuryVault,
    rewardMint: rewardMint,
    tokenProgram,
    systemProgram: anchor.web3.SystemProgram.programId,
    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
  };

  let ix = Instructions.initializeReward(accounts);

  return ix;
}

export function addReward(
  payer: PublicKey,
  farmState: PublicKey,
  rewardVault: PublicKey,
  farmVaultAuthority: PublicKey,
  payerRewardAta: PublicKey,
  rewardMint: PublicKey,
  scopePrices: PublicKey,
  rewardIndex: number,
  tokenProgram: PublicKey,
  amount: anchor.BN,
): TransactionInstruction {
  let accounts: Instructions.AddRewardsAccounts = {
    payer,
    farmState: farmState,
    rewardVault: rewardVault,
    farmVaultsAuthority: farmVaultAuthority,
    payerRewardTokenAta: payerRewardAta,
    rewardMint: rewardMint,
    tokenProgram,
    scopePrices,
  };

  let args: Instructions.AddRewardsArgs = {
    amount: amount,
    rewardIndex: new anchor.BN(rewardIndex),
  };

  let ix = Instructions.addRewards(args, accounts);

  return ix;
}

export function withdrawReward(
  admin: PublicKey,
  farmState: PublicKey,
  rewardMint: PublicKey,
  rewardVault: PublicKey,
  farmVaultAuthority: PublicKey,
  adminRewardAta: PublicKey,
  scopePrices: PublicKey,
  tokenProgram: PublicKey,
  rewardIndex: number,
  amount: anchor.BN,
): TransactionInstruction {
  let accounts: Instructions.WithdrawRewardAccounts = {
    farmAdmin: admin,
    farmState: farmState,
    rewardVault: rewardVault,
    rewardMint,
    farmVaultsAuthority: farmVaultAuthority,
    adminRewardTokenAta: adminRewardAta,
    tokenProgram,
    scopePrices,
  };

  let args: Instructions.WithdrawRewardArgs = {
    amount: amount,
    rewardIndex: new anchor.BN(rewardIndex),
  };

  let ix = Instructions.withdrawReward(args, accounts);

  return ix;
}

export function updateFarmConfig(
  farmAdmin: PublicKey,
  farmState: PublicKey,
  scopePrices: PublicKey,
  rewardIndex: number,
  mode: Types.FarmConfigOptionKind,
  value: number | PublicKey | number[] | RewardCurvePoint[],
): TransactionInstruction {
  let accounts: Instructions.UpdateFarmConfigAccounts = {
    signer: farmAdmin,
    farmState: farmState,
    scopePrices,
  };

  let data: Uint8Array = new Uint8Array();
  let buffer: Buffer;

  switch (mode.discriminator) {
    case FarmConfigOption.LockingStartTimestamp.discriminator:
    case FarmConfigOption.LockingDuration.discriminator:
    case FarmConfigOption.DepositCapAmount.discriminator:
    case FarmConfigOption.LockingEarlyWithdrawalPenaltyBps.discriminator:
    case FarmConfigOption.LockingMode.discriminator:
    case FarmConfigOption.ScopeOracleMaxAge.discriminator:
      buffer = Buffer.alloc(8);
      buffer.writeBigUint64LE(BigInt(value as number), 0);
      data = Uint8Array.from(buffer);
      break;
    case FarmConfigOption.DepositWarmupPeriod.discriminator:
    case FarmConfigOption.WithdrawCooldownPeriod.discriminator:
      buffer = Buffer.alloc(4);
      buffer.writeInt32LE(value as number, 0);
      data = Uint8Array.from(buffer);
      break;
    case FarmConfigOption.ScopeOraclePriceId.discriminator:
      buffer = Buffer.alloc(2);
      buffer.writeUInt16LE(value as number, 0);
      data = Uint8Array.from(buffer);
      break;
    case FarmConfigOption.UpdateStrategyId.discriminator:
    case FarmConfigOption.UpdatePendingFarmAdmin.discriminator:
    case FarmConfigOption.ScopePricesAccount.discriminator:
    case FarmConfigOption.SlashedAmountSpillAddress.discriminator:
    case FarmConfigOption.WithdrawAuthority.discriminator:
    case FarmConfigOption.UpdateDelegatedRpsAdmin.discriminator:
      data = (value as PublicKey).toBytes();
      break;
    case FarmConfigOption.UpdateRewardScheduleCurvePoints.discriminator:
      let points = value as RewardCurvePoint[];
      data = serializeRewardCurvePoint(rewardIndex, points);
      break;
    default:
      data = serializeConfigValue(BigInt(rewardIndex), BigInt(value as number));
      break;
  }

  let args: Instructions.UpdateFarmConfigArgs = {
    mode: mode.discriminator,
    data,
  };

  let ix = Instructions.updateFarmConfig(args, accounts);

  return ix;
}

export function refreshFarm(
  farmState: PublicKey,
  scopePrices: PublicKey,
): TransactionInstruction {
  let accounts: Instructions.RefreshFarmAccounts = {
    farmState: farmState,
    scopePrices,
  };

  let ix = Instructions.refreshFarm(accounts);

  return ix;
}

export function initializeUser(
  farmState: PublicKey,
  owner: PublicKey,
  userState: PublicKey,
): TransactionInstruction {
  let accounts: Instructions.InitializeUserAccounts = {
    authority: owner,
    payer: owner,
    delegatee: owner,
    owner,
    userState: userState,
    farmState: farmState,
    systemProgram: anchor.web3.SystemProgram.programId,
    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
  };

  let ix = Instructions.initializeUser(accounts);

  return ix;
}

export function transferOwnership(
  owner: PublicKey,
  userState: PublicKey,
  newOwner: PublicKey,
): TransactionInstruction {
  let accounts: Instructions.TransferOwnershipAccounts = {
    owner: owner,
    userState: userState,
  };

  let args: Instructions.TransferOwnershipArgs = {
    newOwner,
  };

  let ix = Instructions.transferOwnership(args, accounts);

  return ix;
}

export function stake(
  owner: PublicKey,
  userState: PublicKey,
  ownerTokenAta: PublicKey,
  farmState: PublicKey,
  farmVault: PublicKey,
  tokenMint: PublicKey,
  scopePrices: PublicKey,
  amount: anchor.BN,
): TransactionInstruction {
  let accounts: Instructions.StakeAccounts = {
    owner: owner,
    userState: userState,
    farmState: farmState,
    farmVault: farmVault,
    userAta: ownerTokenAta,
    tokenMint: tokenMint,
    tokenProgram: TOKEN_PROGRAM_ID,
    scopePrices,
  };

  let args: Instructions.StakeArgs = {
    amount,
  };

  let ix = Instructions.stake(args, accounts);

  return ix;
}

export function unstake(
  owner: PublicKey,
  userState: PublicKey,
  farmState: PublicKey,
  scopePrices: PublicKey,
  amount: anchor.BN,
): TransactionInstruction {
  let accounts: Instructions.UnstakeAccounts = {
    owner: owner,
    userState: userState,
    farmState: farmState,
    scopePrices,
  };

  let args: Instructions.UnstakeArgs = {
    stakeSharesScaled: amount,
  };

  let ix = Instructions.unstake(args, accounts);

  return ix;
}

export function harvestReward(
  owner: PublicKey,
  userState: PublicKey,
  userRewardAta: PublicKey,
  globalConfig: PublicKey,
  treasuryVault: PublicKey,
  farmState: PublicKey,
  rewardMint: PublicKey,
  rewardVault: PublicKey,
  farmVaultAuthority: PublicKey,
  scopePrices: PublicKey,
  tokenProgram: PublicKey,
  rewardIndex: number,
): TransactionInstruction {
  let accounts: Instructions.HarvestRewardAccounts = {
    owner: owner,
    userState: userState,
    farmState: farmState,
    globalConfig: globalConfig,
    rewardMint,
    rewardsVault: rewardVault,
    rewardsTreasuryVault: treasuryVault,
    userRewardAta: userRewardAta,
    farmVaultsAuthority: farmVaultAuthority,
    tokenProgram,
    scopePrices,
  };

  let args: Instructions.HarvestRewardArgs = {
    rewardIndex: new anchor.BN(rewardIndex),
  };

  let ix = Instructions.harvestReward(args, accounts);

  return ix;
}

export function withdrawTreasury(
  globalAdmin: PublicKey,
  globalConfig: PublicKey,
  treasuryVault: PublicKey,
  treasuryVaultAuthority: PublicKey,
  globalAdminWithdrawAta: PublicKey,
  amount: anchor.BN,
  rewardMint: PublicKey,
): TransactionInstruction {
  let accounts: Instructions.WithdrawTreasuryAccounts = {
    globalAdmin,
    globalConfig: globalConfig,
    rewardTreasuryVault: treasuryVault,
    treasuryVaultAuthority: treasuryVaultAuthority,
    withdrawDestinationTokenAccount: globalAdminWithdrawAta,
    rewardMint: rewardMint,
    tokenProgram: TOKEN_PROGRAM_ID,
  };

  let args: Instructions.WithdrawTreasuryArgs = {
    amount,
  };

  let ix = Instructions.withdrawTreasury(args, accounts);

  return ix;
}

export function refreshUserState(
  userState: PublicKey,
  farmState: PublicKey,
  scopePrices: PublicKey,
): TransactionInstruction {
  let accounts: Instructions.RefreshUserStateAccounts = {
    userState,
    farmState,
    scopePrices,
  };

  let ix = Instructions.refreshUserState(accounts);

  return ix;
}

export function withdrawUnstakedDeposit(
  owner: PublicKey,
  userState: PublicKey,
  farmState: PublicKey,
  userAta: PublicKey,
  farmVault: PublicKey,
  farmVaultsAuthority: PublicKey,
): TransactionInstruction {
  let accounts: Instructions.WithdrawUnstakedDepositsAccounts = {
    owner,
    userState,
    farmState,
    userAta,
    farmVault,
    farmVaultsAuthority,
    tokenProgram: TOKEN_PROGRAM_ID,
  };

  let ix = Instructions.withdrawUnstakedDeposits(accounts);

  return ix;
}

export function withdrawFromFarmVault(
  withdrawAuthority: PublicKey,
  farmState: PublicKey,
  withdrawerTokenAccount: PublicKey,
  farmVault: PublicKey,
  farmVaultsAuthority: PublicKey,
  amount: anchor.BN,
): TransactionInstruction {
  let accounts: Instructions.WithdrawFromFarmVaultAccounts = {
    farmState,
    withdrawAuthority,
    withdrawerTokenAccount,
    farmVault,
    farmVaultsAuthority,
    tokenProgram: TOKEN_PROGRAM_ID,
  };

  let args: Instructions.WithdrawFromFarmVaultArgs = {
    amount,
  };

  let ix = Instructions.withdrawFromFarmVault(args, accounts);

  return ix;
}

export function depositToFarmVault(
  depositor: PublicKey,
  farmState: PublicKey,
  farmVault: PublicKey,
  depositorAta: PublicKey,
  amount: anchor.BN,
): TransactionInstruction {
  let accounts: Instructions.DepositToFarmVaultAccounts = {
    depositor,
    farmState,
    farmVault,
    depositorAta,
    tokenProgram: TOKEN_PROGRAM_ID,
  };

  let args: Instructions.DepositToFarmVaultArgs = {
    amount,
  };

  let ix = Instructions.depositToFarmVault(args, accounts);

  return ix;
}

export function serializeConfigValue(
  reward_index: bigint,
  value: bigint,
): Uint8Array {
  let buffer: Buffer;
  buffer = Buffer.alloc(16);
  buffer.writeBigUint64LE(reward_index, 0);
  buffer.writeBigUInt64LE(value, 8);
  return Uint8Array.from(buffer);
}
export function serializeRewardCurvePoint(
  reward_index: number,
  points: RewardCurvePoint[],
): Uint8Array {
  let buffer: Buffer;
  buffer = Buffer.alloc(8 + 4 + 16 * points.length);
  buffer.writeBigUint64LE(BigInt(reward_index), 0);
  buffer.writeUInt32LE(points.length, 8);
  for (let i = 0; i < points.length; i++) {
    buffer.writeBigUint64LE(BigInt(points[i].startTs), 12 + 16 * i);
    buffer.writeBigUint64LE(BigInt(points[i].rps), 20 + 16 * i);
  }
  return Uint8Array.from(buffer);
}
