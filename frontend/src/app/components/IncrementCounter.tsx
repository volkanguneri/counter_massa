"use client";
import { useState, useEffect, useCallback } from "react";
import { getWallets, Wallet } from "@massalabs/wallet-provider";
import { Args, OperationStatus, Provider } from "@massalabs/massa-web3";

// Smart Contract Address to interact with
const CONTRACT_ADDRESS = "AS12niiD27mLinQfvQx5dKXm1YjXKkbeiFUVg4g9eHnpPrx4FDbRT";

export default function IncrementCounter() {
  const [provider, setProvider] = useState<Provider>(); // State for the provider
  const [wallet, setWallet] = useState<Wallet>(); // State for the provider
  const [connected, setConnected] = useState<boolean>(false); // State for the provider
  const [count, setCount] = useState<bigint>(); // State to dislpay the count from the smart contract
  const [incrementValue, setIncrementValue] = useState<number | "">(""); // State for the input field
  const [account, setAccount] = useState<string>(""); // State for account
  const [isPendingInc, setIsPendingInc] = useState<boolean>(false); 

  // Inits provider
  const initProvider = useCallback(async () => {
    const walletList = await getWallets();
    console.log("initProvider ~ walletList:", walletList);
    const wallet = walletList[0];
    setWallet(wallet);

    if (!wallet) {
      console.log("No wallet found");
      return;
    }

    // Gets user's account address
    const accounts = await wallet?.accounts();
    setAccount(accounts[0].address)

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

  // Handles wallet connection
  async function connectWallet() {
    console.log("connectWallet ~ wallet:", wallet);
    if (wallet) {
      const connectAction = await wallet.connect();
      setConnected(connectAction);

      if (!connectAction) {
        console.log("Failed to connect to wallet");
        return;
      }

      setCount(await getCount());
    }
  }

  // Gets the count stored in Counter smart contract
  async function getCount() {
    if (!provider) {
      console.log("No provider found");
      return BigInt(0);
    }

    const result = await provider.readSC({
      func: "getCount",
      target: CONTRACT_ADDRESS,
    });

    const resultNumber: bigint = new Args(result.value).nextU64();
    console.log("🚀 ~ getCount ~ resultNumber:", resultNumber)

    return resultNumber;
  }

  // Handles input 
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setIncrementValue(value);
  };

  // Handles button submit
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

    setIsPendingInc(true);

    const op = await provider.callSC({
      parameter: new Args().addU64(BigInt(incrementValue)).serialize(),
      func: "increment",
      target: CONTRACT_ADDRESS,
    });
    console.log("handleSubmit ~ op:", op);

    const status = await op.waitSpeculativeExecution();
    console.log("🚀 ~ handleSubmit ~ status:", status)

    if (status !== OperationStatus.SpeculativeSuccess) {
      alert("Failed to set count");
      return;
    }

    setCount(await getCount());
    setIncrementValue("");
    setIsPendingInc(false);
  };

    // Handles reset button
    const handleReset = async ()  => {
      if (!provider) {
        console.log("No provider found");
        return BigInt(0);
      }

    const op = await provider.callSC({
       func: "reset",
       target: CONTRACT_ADDRESS,
     });

    const status = await op.waitSpeculativeExecution();
    console.log("🚀 ~ handleSubmit ~ status:", status)

    if (status !== OperationStatus.SpeculativeSuccess) {
      alert("Failed to set count");
      return;
    }
    setCount(await getCount());
    }
   
  // If no provider, displays a message to inform the user 
  if (!provider) {
    return (
      <div className="app-container">
        <p>Loading Provider... </p>
        <p>Please install the Massa wallet and configure it for the Buildnet network</p>
      </div>
    );
  }

  // If no wallet, displays a message to inform the user 
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
          name="input"
          value={incrementValue || ""}
          onChange={handleInputChange}
          placeholder="Enter number"
          style={{ marginRight: "10px", padding: "5px" }}
        />
        <button type="submit" style={{ padding: "5px 10px", backgroundColor: "black", color: "white", borderRadius:"1em", cursor:"pointer"}}>
          Increment
          {isPendingInc && <span className="loading loading-spinner loading-xs"></span>}
        </button>
      </form>
      <div>
        <p>Count: {count}</p>
        <button onClick={handleReset} type="button" style={{ padding: "5px 10px", backgroundColor: "black", color: "white", borderRadius:"1em", cursor:"pointer", marginBottom: "2em"}}>
          Reset
        </button>
      </div>
      <div id="userAccount">
        account: {account}
      </div>
    </div>
  );
}