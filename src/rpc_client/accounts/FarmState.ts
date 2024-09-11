import { PublicKey, Connection } from "@solana/web3.js";
import BN from "bn.js"; // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh"; // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types"; // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId";

export interface FarmStateFields {
  farmAdmin: PublicKey;
  globalConfig: PublicKey;
  token: types.TokenInfoFields;
  rewardInfos: Array<types.RewardInfoFields>;
  numRewardTokens: BN;
  /** Data used to calculate the rewards of the user */
  numUsers: BN;
  /**
   * The number of token in the `farm_vault` staked (getting rewards and fees)
   * Set such as `farm_vault.amount = total_staked_amount + total_pending_amount`
   */
  totalStakedAmount: BN;
  farmVault: PublicKey;
  farmVaultsAuthority: PublicKey;
  farmVaultsAuthorityBump: BN;
  /**
   * Only used for delegate farms
   * Set to `default()` otherwise
   */
  delegateAuthority: PublicKey;
  /**
   * Raw representation of a `TimeUnit`
   * Seconds = 0, Slots = 1
   */
  timeUnit: number;
  /**
   * Automatically set to true in case of a full authority withdrawal
   * If true, the farm is frozen and no more deposits are allowed
   */
  isFarmFrozen: number;
  /**
   * Indicates if the farm is a delegate farm
   * If true, the farm is a delegate farm and the `delegate_authority` is set*
   */
  isFarmDelegated: number;
  padding0: Array<number>;
  /**
   * Withdraw authority for the farm, allowed to lock deposited funds and withdraw them
   * Set to `default()` if unused (only the depositors can withdraw their funds)
   */
  withdrawAuthority: PublicKey;
  /**
   * Delay between a user deposit and the moment it is considered as staked
   * 0 if unused
   */
  depositWarmupPeriod: number;
  /** Delay between a user unstake and the ability to withdraw his deposit. */
  withdrawalCooldownPeriod: number;
  /** Total active stake of tokens in the farm (scaled from `Decimal` representation). */
  totalActiveStakeScaled: BN;
  /**
   * Total pending stake of tokens in the farm (scaled from `Decimal` representation).
   * (can be used by `withdraw_authority` but don't get rewards or fees)
   */
  totalPendingStakeScaled: BN;
  /** Total pending amount of tokens in the farm */
  totalPendingAmount: BN;
  /** Slashed amounts from early withdrawal */
  slashedAmountCurrent: BN;
  slashedAmountCumulative: BN;
  slashedAmountSpillAddress: PublicKey;
  /** Locking stake */
  lockingMode: BN;
  lockingStartTimestamp: BN;
  lockingDuration: BN;
  lockingEarlyWithdrawalPenaltyBps: BN;
  depositCapAmount: BN;
  scopePrices: PublicKey;
  scopeOraclePriceId: BN;
  scopeOracleMaxAge: BN;
  pendingFarmAdmin: PublicKey;
  strategyId: PublicKey;
  delegatedRpsAdmin: PublicKey;
  padding: Array<BN>;
}

export interface FarmStateJSON {
  farmAdmin: string;
  globalConfig: string;
  token: types.TokenInfoJSON;
  rewardInfos: Array<types.RewardInfoJSON>;
  numRewardTokens: string;
  /** Data used to calculate the rewards of the user */
  numUsers: string;
  /**
   * The number of token in the `farm_vault` staked (getting rewards and fees)
   * Set such as `farm_vault.amount = total_staked_amount + total_pending_amount`
   */
  totalStakedAmount: string;
  farmVault: string;
  farmVaultsAuthority: string;
  farmVaultsAuthorityBump: string;
  /**
   * Only used for delegate farms
   * Set to `default()` otherwise
   */
  delegateAuthority: string;
  /**
   * Raw representation of a `TimeUnit`
   * Seconds = 0, Slots = 1
   */
  timeUnit: number;
  /**
   * Automatically set to true in case of a full authority withdrawal
   * If true, the farm is frozen and no more deposits are allowed
   */
  isFarmFrozen: number;
  /**
   * Indicates if the farm is a delegate farm
   * If true, the farm is a delegate farm and the `delegate_authority` is set*
   */
  isFarmDelegated: number;
  padding0: Array<number>;
  /**
   * Withdraw authority for the farm, allowed to lock deposited funds and withdraw them
   * Set to `default()` if unused (only the depositors can withdraw their funds)
   */
  withdrawAuthority: string;
  /**
   * Delay between a user deposit and the moment it is considered as staked
   * 0 if unused
   */
  depositWarmupPeriod: number;
  /** Delay between a user unstake and the ability to withdraw his deposit. */
  withdrawalCooldownPeriod: number;
  /** Total active stake of tokens in the farm (scaled from `Decimal` representation). */
  totalActiveStakeScaled: string;
  /**
   * Total pending stake of tokens in the farm (scaled from `Decimal` representation).
   * (can be used by `withdraw_authority` but don't get rewards or fees)
   */
  totalPendingStakeScaled: string;
  /** Total pending amount of tokens in the farm */
  totalPendingAmount: string;
  /** Slashed amounts from early withdrawal */
  slashedAmountCurrent: string;
  slashedAmountCumulative: string;
  slashedAmountSpillAddress: string;
  /** Locking stake */
  lockingMode: string;
  lockingStartTimestamp: string;
  lockingDuration: string;
  lockingEarlyWithdrawalPenaltyBps: string;
  depositCapAmount: string;
  scopePrices: string;
  scopeOraclePriceId: string;
  scopeOracleMaxAge: string;
  pendingFarmAdmin: string;
  strategyId: string;
  delegatedRpsAdmin: string;
  padding: Array<string>;
}

export class FarmState {
  readonly farmAdmin: PublicKey;
  readonly globalConfig: PublicKey;
  readonly token: types.TokenInfo;
  readonly rewardInfos: Array<types.RewardInfo>;
  readonly numRewardTokens: BN;
  /** Data used to calculate the rewards of the user */
  readonly numUsers: BN;
  /**
   * The number of token in the `farm_vault` staked (getting rewards and fees)
   * Set such as `farm_vault.amount = total_staked_amount + total_pending_amount`
   */
  readonly totalStakedAmount: BN;
  readonly farmVault: PublicKey;
  readonly farmVaultsAuthority: PublicKey;
  readonly farmVaultsAuthorityBump: BN;
  /**
   * Only used for delegate farms
   * Set to `default()` otherwise
   */
  readonly delegateAuthority: PublicKey;
  /**
   * Raw representation of a `TimeUnit`
   * Seconds = 0, Slots = 1
   */
  readonly timeUnit: number;
  /**
   * Automatically set to true in case of a full authority withdrawal
   * If true, the farm is frozen and no more deposits are allowed
   */
  readonly isFarmFrozen: number;
  /**
   * Indicates if the farm is a delegate farm
   * If true, the farm is a delegate farm and the `delegate_authority` is set*
   */
  readonly isFarmDelegated: number;
  readonly padding0: Array<number>;
  /**
   * Withdraw authority for the farm, allowed to lock deposited funds and withdraw them
   * Set to `default()` if unused (only the depositors can withdraw their funds)
   */
  readonly withdrawAuthority: PublicKey;
  /**
   * Delay between a user deposit and the moment it is considered as staked
   * 0 if unused
   */
  readonly depositWarmupPeriod: number;
  /** Delay between a user unstake and the ability to withdraw his deposit. */
  readonly withdrawalCooldownPeriod: number;
  /** Total active stake of tokens in the farm (scaled from `Decimal` representation). */
  readonly totalActiveStakeScaled: BN;
  /**
   * Total pending stake of tokens in the farm (scaled from `Decimal` representation).
   * (can be used by `withdraw_authority` but don't get rewards or fees)
   */
  readonly totalPendingStakeScaled: BN;
  /** Total pending amount of tokens in the farm */
  readonly totalPendingAmount: BN;
  /** Slashed amounts from early withdrawal */
  readonly slashedAmountCurrent: BN;
  readonly slashedAmountCumulative: BN;
  readonly slashedAmountSpillAddress: PublicKey;
  /** Locking stake */
  readonly lockingMode: BN;
  readonly lockingStartTimestamp: BN;
  readonly lockingDuration: BN;
  readonly lockingEarlyWithdrawalPenaltyBps: BN;
  readonly depositCapAmount: BN;
  readonly scopePrices: PublicKey;
  readonly scopeOraclePriceId: BN;
  readonly scopeOracleMaxAge: BN;
  readonly pendingFarmAdmin: PublicKey;
  readonly strategyId: PublicKey;
  readonly delegatedRpsAdmin: PublicKey;
  readonly padding: Array<BN>;

  static readonly discriminator = Buffer.from([
    198, 102, 216, 74, 63, 66, 163, 190,
  ]);

  static readonly layout = borsh.struct([
    borsh.publicKey("farmAdmin"),
    borsh.publicKey("globalConfig"),
    types.TokenInfo.layout("token"),
    borsh.array(types.RewardInfo.layout(), 10, "rewardInfos"),
    borsh.u64("numRewardTokens"),
    borsh.u64("numUsers"),
    borsh.u64("totalStakedAmount"),
    borsh.publicKey("farmVault"),
    borsh.publicKey("farmVaultsAuthority"),
    borsh.u64("farmVaultsAuthorityBump"),
    borsh.publicKey("delegateAuthority"),
    borsh.u8("timeUnit"),
    borsh.u8("isFarmFrozen"),
    borsh.u8("isFarmDelegated"),
    borsh.array(borsh.u8(), 5, "padding0"),
    borsh.publicKey("withdrawAuthority"),
    borsh.u32("depositWarmupPeriod"),
    borsh.u32("withdrawalCooldownPeriod"),
    borsh.u128("totalActiveStakeScaled"),
    borsh.u128("totalPendingStakeScaled"),
    borsh.u64("totalPendingAmount"),
    borsh.u64("slashedAmountCurrent"),
    borsh.u64("slashedAmountCumulative"),
    borsh.publicKey("slashedAmountSpillAddress"),
    borsh.u64("lockingMode"),
    borsh.u64("lockingStartTimestamp"),
    borsh.u64("lockingDuration"),
    borsh.u64("lockingEarlyWithdrawalPenaltyBps"),
    borsh.u64("depositCapAmount"),
    borsh.publicKey("scopePrices"),
    borsh.u64("scopeOraclePriceId"),
    borsh.u64("scopeOracleMaxAge"),
    borsh.publicKey("pendingFarmAdmin"),
    borsh.publicKey("strategyId"),
    borsh.publicKey("delegatedRpsAdmin"),
    borsh.array(borsh.u64(), 82, "padding"),
  ]);

  constructor(fields: FarmStateFields) {
    this.farmAdmin = fields.farmAdmin;
    this.globalConfig = fields.globalConfig;
    this.token = new types.TokenInfo({ ...fields.token });
    this.rewardInfos = fields.rewardInfos.map(
      (item) => new types.RewardInfo({ ...item }),
    );
    this.numRewardTokens = fields.numRewardTokens;
    this.numUsers = fields.numUsers;
    this.totalStakedAmount = fields.totalStakedAmount;
    this.farmVault = fields.farmVault;
    this.farmVaultsAuthority = fields.farmVaultsAuthority;
    this.farmVaultsAuthorityBump = fields.farmVaultsAuthorityBump;
    this.delegateAuthority = fields.delegateAuthority;
    this.timeUnit = fields.timeUnit;
    this.isFarmFrozen = fields.isFarmFrozen;
    this.isFarmDelegated = fields.isFarmDelegated;
    this.padding0 = fields.padding0;
    this.withdrawAuthority = fields.withdrawAuthority;
    this.depositWarmupPeriod = fields.depositWarmupPeriod;
    this.withdrawalCooldownPeriod = fields.withdrawalCooldownPeriod;
    this.totalActiveStakeScaled = fields.totalActiveStakeScaled;
    this.totalPendingStakeScaled = fields.totalPendingStakeScaled;
    this.totalPendingAmount = fields.totalPendingAmount;
    this.slashedAmountCurrent = fields.slashedAmountCurrent;
    this.slashedAmountCumulative = fields.slashedAmountCumulative;
    this.slashedAmountSpillAddress = fields.slashedAmountSpillAddress;
    this.lockingMode = fields.lockingMode;
    this.lockingStartTimestamp = fields.lockingStartTimestamp;
    this.lockingDuration = fields.lockingDuration;
    this.lockingEarlyWithdrawalPenaltyBps =
      fields.lockingEarlyWithdrawalPenaltyBps;
    this.depositCapAmount = fields.depositCapAmount;
    this.scopePrices = fields.scopePrices;
    this.scopeOraclePriceId = fields.scopeOraclePriceId;
    this.scopeOracleMaxAge = fields.scopeOracleMaxAge;
    this.pendingFarmAdmin = fields.pendingFarmAdmin;
    this.strategyId = fields.strategyId;
    this.delegatedRpsAdmin = fields.delegatedRpsAdmin;
    this.padding = fields.padding;
  }

  static async fetch(
    c: Connection,
    address: PublicKey,
    programId: PublicKey = PROGRAM_ID,
  ): Promise<FarmState | null> {
    const info = await c.getAccountInfo(address);

    if (info === null) {
      return null;
    }
    if (!info.owner.equals(programId)) {
      throw new Error("account doesn't belong to this program");
    }

    return this.decode(info.data);
  }

  static async fetchMultiple(
    c: Connection,
    addresses: PublicKey[],
    programId: PublicKey = PROGRAM_ID,
  ): Promise<Array<FarmState | null>> {
    const infos = await c.getMultipleAccountsInfo(addresses);

    return infos.map((info) => {
      if (info === null) {
        return null;
      }
      if (!info.owner.equals(programId)) {
        throw new Error("account doesn't belong to this program");
      }

      return this.decode(info.data);
    });
  }

  static decode(data: Buffer): FarmState {
    if (!data.slice(0, 8).equals(FarmState.discriminator)) {
      throw new Error("invalid account discriminator");
    }

    const dec = FarmState.layout.decode(data.slice(8));

    return new FarmState({
      farmAdmin: dec.farmAdmin,
      globalConfig: dec.globalConfig,
      token: types.TokenInfo.fromDecoded(dec.token),
      rewardInfos: dec.rewardInfos.map(
        (
          item: any /* eslint-disable-line @typescript-eslint/no-explicit-any */,
        ) => types.RewardInfo.fromDecoded(item),
      ),
      numRewardTokens: dec.numRewardTokens,
      numUsers: dec.numUsers,
      totalStakedAmount: dec.totalStakedAmount,
      farmVault: dec.farmVault,
      farmVaultsAuthority: dec.farmVaultsAuthority,
      farmVaultsAuthorityBump: dec.farmVaultsAuthorityBump,
      delegateAuthority: dec.delegateAuthority,
      timeUnit: dec.timeUnit,
      isFarmFrozen: dec.isFarmFrozen,
      isFarmDelegated: dec.isFarmDelegated,
      padding0: dec.padding0,
      withdrawAuthority: dec.withdrawAuthority,
      depositWarmupPeriod: dec.depositWarmupPeriod,
      withdrawalCooldownPeriod: dec.withdrawalCooldownPeriod,
      totalActiveStakeScaled: dec.totalActiveStakeScaled,
      totalPendingStakeScaled: dec.totalPendingStakeScaled,
      totalPendingAmount: dec.totalPendingAmount,
      slashedAmountCurrent: dec.slashedAmountCurrent,
      slashedAmountCumulative: dec.slashedAmountCumulative,
      slashedAmountSpillAddress: dec.slashedAmountSpillAddress,
      lockingMode: dec.lockingMode,
      lockingStartTimestamp: dec.lockingStartTimestamp,
      lockingDuration: dec.lockingDuration,
      lockingEarlyWithdrawalPenaltyBps: dec.lockingEarlyWithdrawalPenaltyBps,
      depositCapAmount: dec.depositCapAmount,
      scopePrices: dec.scopePrices,
      scopeOraclePriceId: dec.scopeOraclePriceId,
      scopeOracleMaxAge: dec.scopeOracleMaxAge,
      pendingFarmAdmin: dec.pendingFarmAdmin,
      strategyId: dec.strategyId,
      delegatedRpsAdmin: dec.delegatedRpsAdmin,
      padding: dec.padding,
    });
  }

  toJSON(): FarmStateJSON {
    return {
      farmAdmin: this.farmAdmin.toString(),
      globalConfig: this.globalConfig.toString(),
      token: this.token.toJSON(),
      rewardInfos: this.rewardInfos.map((item) => item.toJSON()),
      numRewardTokens: this.numRewardTokens.toString(),
      numUsers: this.numUsers.toString(),
      totalStakedAmount: this.totalStakedAmount.toString(),
      farmVault: this.farmVault.toString(),
      farmVaultsAuthority: this.farmVaultsAuthority.toString(),
      farmVaultsAuthorityBump: this.farmVaultsAuthorityBump.toString(),
      delegateAuthority: this.delegateAuthority.toString(),
      timeUnit: this.timeUnit,
      isFarmFrozen: this.isFarmFrozen,
      isFarmDelegated: this.isFarmDelegated,
      padding0: this.padding0,
      withdrawAuthority: this.withdrawAuthority.toString(),
      depositWarmupPeriod: this.depositWarmupPeriod,
      withdrawalCooldownPeriod: this.withdrawalCooldownPeriod,
      totalActiveStakeScaled: this.totalActiveStakeScaled.toString(),
      totalPendingStakeScaled: this.totalPendingStakeScaled.toString(),
      totalPendingAmount: this.totalPendingAmount.toString(),
      slashedAmountCurrent: this.slashedAmountCurrent.toString(),
      slashedAmountCumulative: this.slashedAmountCumulative.toString(),
      slashedAmountSpillAddress: this.slashedAmountSpillAddress.toString(),
      lockingMode: this.lockingMode.toString(),
      lockingStartTimestamp: this.lockingStartTimestamp.toString(),
      lockingDuration: this.lockingDuration.toString(),
      lockingEarlyWithdrawalPenaltyBps:
        this.lockingEarlyWithdrawalPenaltyBps.toString(),
      depositCapAmount: this.depositCapAmount.toString(),
      scopePrices: this.scopePrices.toString(),
      scopeOraclePriceId: this.scopeOraclePriceId.toString(),
      scopeOracleMaxAge: this.scopeOracleMaxAge.toString(),
      pendingFarmAdmin: this.pendingFarmAdmin.toString(),
      strategyId: this.strategyId.toString(),
      delegatedRpsAdmin: this.delegatedRpsAdmin.toString(),
      padding: this.padding.map((item) => item.toString()),
    };
  }

  static fromJSON(obj: FarmStateJSON): FarmState {
    return new FarmState({
      farmAdmin: new PublicKey(obj.farmAdmin),
      globalConfig: new PublicKey(obj.globalConfig),
      token: types.TokenInfo.fromJSON(obj.token),
      rewardInfos: obj.rewardInfos.map((item) =>
        types.RewardInfo.fromJSON(item),
      ),
      numRewardTokens: new BN(obj.numRewardTokens),
      numUsers: new BN(obj.numUsers),
      totalStakedAmount: new BN(obj.totalStakedAmount),
      farmVault: new PublicKey(obj.farmVault),
      farmVaultsAuthority: new PublicKey(obj.farmVaultsAuthority),
      farmVaultsAuthorityBump: new BN(obj.farmVaultsAuthorityBump),
      delegateAuthority: new PublicKey(obj.delegateAuthority),
      timeUnit: obj.timeUnit,
      isFarmFrozen: obj.isFarmFrozen,
      isFarmDelegated: obj.isFarmDelegated,
      padding0: obj.padding0,
      withdrawAuthority: new PublicKey(obj.withdrawAuthority),
      depositWarmupPeriod: obj.depositWarmupPeriod,
      withdrawalCooldownPeriod: obj.withdrawalCooldownPeriod,
      totalActiveStakeScaled: new BN(obj.totalActiveStakeScaled),
      totalPendingStakeScaled: new BN(obj.totalPendingStakeScaled),
      totalPendingAmount: new BN(obj.totalPendingAmount),
      slashedAmountCurrent: new BN(obj.slashedAmountCurrent),
      slashedAmountCumulative: new BN(obj.slashedAmountCumulative),
      slashedAmountSpillAddress: new PublicKey(obj.slashedAmountSpillAddress),
      lockingMode: new BN(obj.lockingMode),
      lockingStartTimestamp: new BN(obj.lockingStartTimestamp),
      lockingDuration: new BN(obj.lockingDuration),
      lockingEarlyWithdrawalPenaltyBps: new BN(
        obj.lockingEarlyWithdrawalPenaltyBps,
      ),
      depositCapAmount: new BN(obj.depositCapAmount),
      scopePrices: new PublicKey(obj.scopePrices),
      scopeOraclePriceId: new BN(obj.scopeOraclePriceId),
      scopeOracleMaxAge: new BN(obj.scopeOracleMaxAge),
      pendingFarmAdmin: new PublicKey(obj.pendingFarmAdmin),
      strategyId: new PublicKey(obj.strategyId),
      delegatedRpsAdmin: new PublicKey(obj.delegatedRpsAdmin),
      padding: obj.padding.map((item) => new BN(item)),
    });
  }
}
