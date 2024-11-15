"use client";
import { useState, useEffect, useCallback } from "react";
import { getWallets, Wallet } from "@massalabs/wallet-provider";
import { Args, EventPoller, OperationStatus, Provider, SCEvent } from "@massalabs/massa-web3";
// import { scheduler } from "timers/promises";

// Smart Contract Address to interact with
const CONTRACT_ADDRESS = "AS12niiD27mLinQfvQx5dKXm1YjXKkbeiFUVg4g9eHnpPrx4FDbRT";

export default function IncrementCounter() {
  const [provider, setProvider] = useState<Provider>(); // State for the provider
  const [wallet, setWallet] = useState<Wallet>(); // State for the provider
  const [connected, setConnected] = useState<boolean>(false); // State for the provider
  const [count, setCount] = useState<bigint>(); // State to dislpay the count from the smart contract
  const [incrementValue, setIncrementValue] = useState<number | "">(""); // State for the input field
  const [account, setAccount] = useState<string>(""); // State for account
  const [isPendingInc, setIsPendingInc] = useState<boolean>(false); // To create spinner for Increment button
  const [isPendingRes, setIsPendingRes] = useState<boolean>(false); // To create spinner for Reset button
  const [events, setEvents] = useState<SCEvent[]>([]);
  const [eventsStop, setEventsStop] = useState<boolean>(false);

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
    setAccount(accounts[0].address);

    if (accounts.length === 0) {
      console.log("No accounts found");
      return;
    }

    // We use the first account as the provider
    const provider = accounts[0];
    setProvider(provider);

    //////////////////////////////////////////////////////////
    // event poller

    // Callback function for handling incoming events
    const onData = async (events: SCEvent[]) => {
      setEvents(events);
      for (const event of events) {
        console.log(`Event period: ${event.context.slot.period} thread: ${event.context.slot.thread} -`, event.data);
      }
    };

    // Callback function for handling errors
    const onError = (error: Error) => {
      console.error("Error:", error);
      setEventsStop(true); // Stop polling in case of an error
    };

    if (!provider) {
      console.error("Provider not initialized");
      return;
    }

    // Start the event poller with a 5-second interval
    // const poller = new EventPoller(provider, start, 5000);
    const { stopPolling } = EventPoller.start(
      provider,
      {
        smartContractAddress: CONTRACT_ADDRESS,
      },
      onData,
      onError,
      5000 // Polling interval in milliseconds
    );

    // Continue polling until stopped
    // while (!stop) {
    //   await scheduler.wait(5000);
    // }
    // stopPolling(); // Stop polling once the loop terminates
  }, []);

  const shortenedAccount = account ? `${account.slice(0, 4)}...${account.slice(-2)}` : "";

  useEffect(() => {
    initProvider();
  }, [initProvider]);

  useEffect(() => {
    console.log("useEffect ~ events:", events);
    if (events.length > 0) {
      alert(events.at(-1)?.data);
    }
  }, [events]);

  // Handles wallet connection
  async function connectWallet() {
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

    return resultNumber;
  }

  // Handles input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setIncrementValue(value);
  };

  // Handles button submit
  const handleSubmit = async (e: React.FormEvent) => {
    try {
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

      const status = await op.waitSpeculativeExecution();

      if (status !== OperationStatus.SpeculativeSuccess) {
        alert("Failed to set count");
        return;
      }

      setCount(await getCount());
      setIncrementValue("");
      setIsPendingInc(false);
    } catch (e) {
      console.info(e instanceof Error ? e.message : String(e));
      setIsPendingInc(false);
    }
  };

  // Handles reset button
  const handleReset = async () => {
    try {
    if (!provider) {
      console.log("No provider found");
      return BigInt(0);
    }

    setIsPendingRes(true);

    const op = await provider.callSC({
      func: "reset",
      target: CONTRACT_ADDRESS,
    });

    const status = await op.waitSpeculativeExecution();

    if (status !== OperationStatus.SpeculativeSuccess) {
      alert("Failed to set count");
      return;
    }
    setCount(await getCount());
    setIsPendingRes(false);
  } catch (e) {
    console.info(e instanceof Error ? e.message : String(e));
    setIsPendingRes(false);
  }
  };

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
        <button
          onClick={() => connectWallet()}
          style={{
            padding: "5px 10px",
            backgroundColor: "black",
            color: "white",
            borderRadius: ".7em",
            cursor: "pointer",
            marginBottom: "2em",
          }}
        >
          Connect
        </button>
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
        <button
          type="submit"
          style={{
            padding: "5px 10px",
            backgroundColor: "black",
            color: "white",
            borderRadius: ".7em",
            cursor: "pointer",
          }}
        >
          Increment
          {isPendingInc && <span style={{ marginLeft: "1em" }} className="loading loading-spinner loading-xs"></span>}
        </button>
      </form>
      <div>
        <p>Count: {count}</p>
        <button
          onClick={handleReset}
          type="button"
          style={{
            padding: "5px 10px",
            backgroundColor: "black",
            color: "white",
            borderRadius: ".7em",
            cursor: "pointer",
            marginBottom: "2em",
          }}
        >
          Reset
          {isPendingRes && <span style={{ marginLeft: "1em" }} className="loading loading-spinner loading-xs"></span>}
        </button>
      </div>
      <div id="userAccount">account: {account}</div>
      <div></div>
    </div>
  );
}