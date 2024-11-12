'use client'
import { useState, useEffect } from 'react';
import { getWallets } from "../../../../backend/node_modules/@massalabs/wallet-provider";
import {
  Args,
  bytesToStr,
  OperationStatus,
  Provider,
} from "../../../../backend/node_modules/@massalabs/massa-web3";

// Smart Contract Address to interact with
const CONTRACT_ADDRESS = "AS128meaUmpiRsSUr1AtW2G6xC7LCGAAFzuif3dJAmUd1igreAakc"; 

export default function IncrementCounter() {
  const [provider, setProvider] = useState<Provider>(); // State for the provider
  const [count, setCount] = useState<number>(0); // State to dispay the count from the smart contract
  const [incrementValue, setIncrementValue] = useState<number>(); // State for the input field

  async function initProvider() {
    const walletList = await getWallets();
    const wallet = walletList.find(
      (provider: { name: () => string; }) => provider.name() === "MASSASTATION"
    );
    if (!wallet) {
      console.log("No wallet found");
      return;
    }
    
    const accounts = await wallet?.accounts();

    if (accounts.length === 0) {
      console.log("No accounts found");
      return;
    }

    // We use the first account as the provider
    const provider = accounts[0];
    setProvider(provider);
  }

  useEffect(() => {
    initProvider();
  }, []);

  // Gets than count stored in Counter smart Contract
  async function getCount() {

    if (!provider) {
      console.log("No provider found");
      return "";
    }

    const result = await provider.readSC({
      func: "getCount",
      target: CONTRACT_ADDRESS,
    });

    const resultNumber : number = new Args(result.value).nextU32();

    return resultNumber;
  }

  // // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setIncrementValue(isNaN(value) ? 0 : value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    if (!provider) {
      alert("No provider found");
      return;
    }

    e.preventDefault();

    if (!incrementValue) {
      alert("Please enter a number");
    }

    const op = await provider.callSC({
      parameter: new Args().addU32(incrementValue).serialize(),
      func: "setCount",
      target: CONTRACT_ADDRESS,
    });

    const status = await op.waitSpeculativeExecution();

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
        <p>
          Please install the Massa wallet and configure it for the Buildnet
          network
        </p>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <form onSubmit={handleSubmit}>
        <input
          type="number"
          value={incrementValue}
          onChange={handleInputChange}
          placeholder="Enter number"
          style={{ marginRight: '10px', padding: '5px' }}
          />
      
        <button type="submit" style={{ padding: '5px 10px' }}>
          Increment
        </button>
          <p>Count: {count}</p>
        </form>
    </div>
  );
}

