# 🎉 Counter DApp on the Massa Blockchain 

## ⚙️ Installation Guide

From the root of the project, simply run:

```shell
Pnpm install
```
💡 Note: There's a workspace setup at the root, so this will install all dependencies for both backend and frontend simultaneously!

## 🔨 Building the Backend

Navigate to the backend:

```shell
cd backend
```

Then, to build all files in the `assembly/contracts` directory, run: 

```shell
pnpm run build
```

## 🧪 Running Unit Tests

To test the smart contract, simply use:

```shell
pnpm run test
```

## 🚀 Deploying the Contract

1. Create a .env file in the backend folder with the following

```shell
  WALLET_SECRET_KEY=
```
🗝️ This key will be used by the deployer script to interact with the blockchain.

2. To build the contracts in `assembly/contracts` and run the deployment script `src/deploy.ts`, which deploys to the node specified in the `.env` file:

```shell
pnpm run deploy
```
3. When deployment finishes, you’ll see the smart contract’s deployment address in the console. 

- Copy this address 
- Replace CONTRACT_ADDRESS with the deployed address in 

```shell
frontend/src/app/components/IncrementCounter.tsx
```

## User Interface 


