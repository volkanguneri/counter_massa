"use client";
import { useState, useEffect, useCallback } from "react";
import { getWallets, Wallet } from "@massalabs/wallet-provider";
import { Args, bytesToStr, OperationStatus, Provider } from "@massalabs/massa-web3";
// import {
//   ClientFactory,
//   Args,
//   Address,
//   IClient,
//   fromMAS,
// } from '@massalabs/massa-web3';

// Smart Contract Address to interact with
const CONTRACT_ADDRESS = "AS128meaUmpiRsSUr1AtW2G6xC7LCGAAFzuif3dJAmUd1igreAakc";

export default function IncrementCounter() {
  const [provider, setProvider] = useState<Provider>(); // State for the provider
  const [wallet, setWallet] = useState<Wallet>(); // State for the provider
  const [connected, setConnected] = useState<boolean>(false); // State for the provider
  const [count, setCount] = useState<bigint>(BigInt(0)); // State to dispay the count from the smart contract
  const [incrementValue, setIncrementValue] = useState<number>(0); // State for the input field

  // async function initProvider() {
  const initProvider = useCallback(async () => {
    const walletList = await getWallets();
    console.log("initProvider ~ walletList:", walletList);
    // const wallet = walletList.find((provider: { name: () => string }) => provider.name() === "BEARBY");
    const wallet = walletList[0];
    setWallet(wallet);
    
    if (!wallet) {
      console.log("No wallet found");
      return;
    }

    const accounts = await wallet?.accounts();
    console.log("🚀 ~ initProvider ~ accounts:", accounts)

    if (accounts.length === 0) {
      console.log("No accounts found");
      return;
    }

    // We use the first account as the provider
    const provider = accounts[0];
    console.log("initProvider ~ provider:", provider);
    setProvider(provider);
  }, []);

  useEffect(() => {
    initProvider();
  }, [initProvider]);

  async function connectWallet() {
    console.log("connectWallet ~ wallet:", wallet);
    if (wallet) {
      const connectAction = await wallet.connect();
      setConnected(connectAction);

      if (!connectAction) {
        console.log("Failed to connect to wallet");
        return;
      }
    }
  }

  // Gets than count stored in Counter smart Contract
  async function getCount() {
    if (!provider) {
      console.log("No provider found");
      return BigInt(0);
    }

    const result = await provider.readSC({
      func: "getCount",
      target: CONTRACT_ADDRESS,
    });

    const resultNumber: bigint = new Args(result.value).nextU32();

    return resultNumber;
  }

  // // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setIncrementValue(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    if (!provider) {
      alert("No provider found");
      return;
    }

    e.preventDefault();

    if (!incrementValue) {
      alert("Please enter a number");
      return;
    }

    const op = await provider.callSC({
      parameter: new Args().addU32(BigInt(incrementValue)).serialize(),
      func: "setCount",
      target: CONTRACT_ADDRESS,
    });

    const status = await op.waitSpeculativeExecution();
    console.log("🚀 ~ handleSubmit ~ status:", status)

    if (status !== OperationStatus.SpeculativeSuccess) {
      alert("Failed to set count");
      return;
    }

    setCount(await getCount());
    setIncrementValue(0);
  };

  if (!provider) {
    return (
      <div className="app-container">
        <p>Loading Provider... </p>
        <p>Please install the Massa wallet and configure it for the Buildnet network</p>
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="app-container">
        <p>Wallet not connected... </p>
        <p>Please connect your Massa wallet</p>
        <button onClick={() => connectWallet()}>Connect</button>
      </div>
    );
  }

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <form onSubmit={handleSubmit}>
        <input
          type="number"
          value={incrementValue}
          onChange={handleInputChange}
          placeholder="Enter number"
          style={{ marginRight: "10px", padding: "5px" }}
        />

        <button type="submit" style={{ padding: "5px 10px" }}>
          Increment
        </button>
        <p>Count: {count}</p>
      </form>
    </div>
  );
}