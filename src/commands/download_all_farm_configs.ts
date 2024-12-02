import { getFarmsProgramId, lamportsToCollDecimal } from "../utils";
import { initializeClient } from "./utils";
import { Farms } from "../Farms";
import * as fs from "fs";
import { PublicKey } from "@solana/web3.js";
import {
  getMarketsFromApi,
  KaminoMarket,
  PublicKeySet,
  U64_MAX,
} from "@kamino-finance/klend-sdk";
import { FarmState } from "../rpc_client/accounts";
import Decimal from "decimal.js";
import { RewardType } from "../rpc_client/types";
import { Kamino } from "@kamino-finance/kliquidity-sdk";

export async function downloadAllFarmConfigs(targetPath: string) {
  const admin = process.env.ADMIN!;
  const rpc = process.env.RPC!;
  const klendProgramId = new PublicKey(process.env.KLEND_PROGRAM_ID!);
  const lendingMarkets = await getMarketsFromApiData(klendProgramId);

  const env = initializeClient(rpc, admin, getFarmsProgramId(rpc), false);

  const farmClient = new Farms(env.provider.connection);

  const allFarms = await farmClient.getAllFarmStates();

  const fetchedFarmsForStratsAndReserves = new PublicKeySet<PublicKey>([]);

  // Download for lending based on API markets - all reserve farms
  for (const market of lendingMarkets) {
    const kaminoMarket = await KaminoMarket.load(
      env.provider.connection,
      market.key,
      450,
      klendProgramId,
    );

    if (!kaminoMarket) {
      throw new Error("Kamino market not found");
    }

    fs.mkdirSync(`${targetPath}/lending/${market.marketName}`, {
      recursive: true,
    });

    for (const reserve of kaminoMarket.reserves.values()) {
      if (!reserve.state.farmCollateral.equals(PublicKey.default)) {
        fetchedFarmsForStratsAndReserves.add(reserve.state.farmCollateral);
        const farmStateCollateral = await FarmState.fetch(
          env.provider.connection,
          reserve.state.farmCollateral,
        );
        if (farmStateCollateral) {
          const farmConfig = getFarmConfigType(
            reserve.state.farmCollateral,
            farmStateCollateral,
            {
              type: "reserve",
              reserve: reserve.address,
              market: market.key,
              strategy: undefined,
            },
          );

          fs.writeFileSync(
            `${targetPath}/lending/${market.marketName}/${
              reserve!.symbol
            }-Collateral.json`,
            JSON.stringify(farmConfig, null, 2),
          );
        } else {
          console.log(
            "Could not fetch farm",
            reserve.state.farmCollateral.toBase58(),
          );
        }
      }
      if (!reserve.state.farmDebt.equals(PublicKey.default)) {
        fetchedFarmsForStratsAndReserves.add(reserve.state.farmDebt);
        const farmStateDebt = await FarmState.fetch(
          env.provider.connection,
          reserve.state.farmDebt,
        );
        if (farmStateDebt) {
          const farmConfig = getFarmConfigType(
            reserve.state.farmDebt,
            farmStateDebt,
            {
              type: "reserve",
              reserve: reserve.address,
              market: market.key,
              strategy: undefined,
            },
          );

          fs.writeFileSync(
            `${targetPath}/lending/${market.marketName}/${
              reserve!.symbol
            }-Debt.json`,
            JSON.stringify(farmConfig, null, 2),
          );
        } else {
          console.log(
            "Could not fetch farm",
            reserve.state.farmDebt.toBase58(),
          );
        }
      }
    }
  }

  // Download for yvaults all strategy farms
  const kamino = new Kamino("mainnet-beta", env.provider.connection);

  let strategies = await kamino.getAllStrategiesWithFilters({
    strategyCreationStatus: "LIVE",
  });

  fs.mkdirSync(`${targetPath}/yvaults/`, { recursive: true });

  for (const strategy of strategies) {
    const farmAddress = strategy!.strategy.farm;
    if (!farmAddress.equals(PublicKey.default)) {
      fetchedFarmsForStratsAndReserves.add(farmAddress);
      const farmState = await FarmState.fetch(
        env.provider.connection,
        farmAddress,
      );
      if (farmState) {
        const farmConfig = getFarmConfigType(farmAddress, farmState, {
          type: "strategy",
          reserve: undefined,
          market: undefined,
          strategy: strategy.address,
        });
        // in case strategy is not set on farm side, we override value so we set on next upsert
        farmConfig.strategyId = strategy.address;

        fs.writeFileSync(
          `${targetPath}/yvaults/${strategy.address.toBase58()}.json`,
          JSON.stringify(farmConfig, null, 2),
        );
      } else {
        console.log("Could not fetch farm", farmAddress.toBase58());
      }
    }
  }

  // Download all standalone farms
  fs.mkdirSync(`${targetPath}/standaloneFarms/`, { recursive: true });
  for (const farmAndKey of allFarms) {
    // skip farms already downloaded as part of reserves or strategies
    if (fetchedFarmsForStratsAndReserves.contains(farmAndKey.key)) {
      continue;
    }

    const farmConfig = getFarmConfigType(farmAndKey.key, farmAndKey.farmState, {
      type: "standalone",
      reserve: undefined,
      market: undefined,
      strategy: undefined,
    });

    fs.writeFileSync(
      `${targetPath}/standaloneFarms/${farmAndKey.key.toBase58()}.json`,
      JSON.stringify(farmConfig, null, 2),
    );
  }
}

export async function getMarketsFromApiData(
  programId: PublicKey,
): Promise<{ marketName: string; key: PublicKey }[]> {
  const markets: { marketName: string; key: PublicKey }[] = [];
  await getMarketsFromApi(programId, "API").then(function (response) {
    for (const marketData of response) {
      markets.push({
        marketName: marketData.description.replace(" ", "-"),
        key: new PublicKey(marketData.lendingMarket),
      });
    }
  });

  return markets;
}

export type FarmConfig = {
  farmMetadata: FarmMetadata;
  farmPubkey: PublicKey;
  stakingTokenMint: PublicKey;
  withdrawAuthority: PublicKey;
  globalConfig: PublicKey;
  strategyId: PublicKey;
  depositCapAmount: number;
  rewards: Array<
    | {
        rewardTokenMint: PublicKey;
        rewardType: string;
        rewardPerSecondDecimals: number;
        minClaimDurationSeconds: number;
        rewardCurve: Array<
          | {
              startTs: number;
              rps: number;
            }
          | undefined
        >;
        rewardAvailable: number;
        rewardToTopUp: number;
        rewardToTopUpDurationDays: number;
      }
    | undefined
  >;
  pendingFarmAdmin: PublicKey;
  scopePrices: PublicKey;
  scopePriceOracleId: string;
  scopeOracleMaxAge: number;
  lockingMode: number;
  lockingStart: number;
  lockingDuration: number;
  lockingEarlyWithdrawalPenaltyBps: number;
  depositWarmupPeriod: number;
  withdrawCooldownPeriod: number;
  slashedAmountSpillAddress: PublicKey;
  delegatedRpsAdmin: PublicKey;
};

export type FarmMetadata = {
  type: string; // strategy or reserve
  reserve: PublicKey | undefined;
  market: PublicKey | undefined;
  strategy: PublicKey | undefined;
};

function getRewardType(rewardTypeNumber: number): string {
  switch (rewardTypeNumber) {
    case RewardType.Proportional.discriminator:
      return RewardType.Proportional.kind;
    case RewardType.Constant.discriminator:
      return RewardType.Constant.kind;
    default:
      throw new Error(`Invalid reward type: ${rewardTypeNumber}`);
  }
}

export function getFarmConfigType(
  farmKey: PublicKey,
  farmState: FarmState,
  farmMetadata: FarmMetadata,
): FarmConfig {
  return {
    farmMetadata,
    farmPubkey: farmKey,
    stakingTokenMint: farmState.token.mint,
    withdrawAuthority: farmState.withdrawAuthority,
    globalConfig: farmState.globalConfig,
    strategyId: farmState.strategyId, // reserve farm
    depositCapAmount: new Decimal(
      farmState.depositCapAmount.toString(),
    ).toNumber(),
    rewards: farmState.rewardInfos
      .map((rewardInfo) => {
        if (!rewardInfo.token.mint.equals(PublicKey.default)) {
          return {
            rewardTokenMint: rewardInfo.token.mint,
            rewardType: getRewardType(rewardInfo.rewardType),
            rewardPerSecondDecimals: rewardInfo.rewardsPerSecondDecimals,
            minClaimDurationSeconds: new Decimal(
              rewardInfo.minClaimDurationSeconds.toString(),
            ).toNumber(),
            rewardCurve: rewardInfo.rewardScheduleCurve.points
              .map((point) => {
                if (
                  new Decimal(point.rewardPerTimeUnit.toString()).toNumber() !==
                    0 ||
                  point.tsStart.toString() !== U64_MAX
                ) {
                  return {
                    startTs: new Decimal(point.tsStart.toString()).toNumber(),
                    rps: new Decimal(
                      point.rewardPerTimeUnit.toString(),
                    ).toNumber(),
                  };
                }
                return undefined;
              })
              .filter((point) => point !== undefined),
            rewardAvailable: lamportsToCollDecimal(
              new Decimal(rewardInfo.rewardsAvailable.toString()),
              rewardInfo.token.decimals.toNumber(),
            )
              .floor()
              .toNumber(),
            rewardToTopUp: 0,
            rewardToTopUpDurationDays: 0,
          };
        }
        return undefined;
      })
      .filter((rewardInfoConfig) => rewardInfoConfig !== undefined),
    pendingFarmAdmin: farmState.pendingFarmAdmin,
    scopePrices: farmState.scopePrices,
    scopePriceOracleId: farmState.scopeOraclePriceId.toString(),
    scopeOracleMaxAge: new Decimal(
      farmState.scopeOracleMaxAge.toString(),
    ).toNumber(),
    lockingMode: new Decimal(farmState.lockingMode.toString()).toNumber(),
    lockingStart: new Decimal(
      farmState.lockingStartTimestamp.toString(),
    ).toNumber(),
    lockingDuration: new Decimal(
      farmState.lockingDuration.toString(),
    ).toNumber(),
    lockingEarlyWithdrawalPenaltyBps: new Decimal(
      farmState.lockingEarlyWithdrawalPenaltyBps.toString(),
    ).toNumber(),
    depositWarmupPeriod: farmState.depositWarmupPeriod,
    withdrawCooldownPeriod: farmState.withdrawalCooldownPeriod,
    slashedAmountSpillAddress: farmState.slashedAmountSpillAddress,
    delegatedRpsAdmin: farmState.delegatedRpsAdmin,
  };
}
