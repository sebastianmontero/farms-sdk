# Farms SDK

Farms SDK is a TypeScript client SDK for easy access to the Farms on-chain data.

## How to install the SDK

[![npm](https://img.shields.io/npm/v/@kamino-finance/farms-sdk)](https://www.npmjs.com/package/@kamino-finance/farms-sdk)

```shell
npm install @solana/web3.js decimal.js @kamino-finance/farms-sdk 
```

```shell
npm update @kamino-finance/farms-sdk
```

## How to use the SDK

```typescript
// Initialize the client and then you can use it to fetch data by calling it
const farmsClient = new Farms(env.provider.connection);
```
