
import { useState, useEffect, useCallback } from "react";
import { Args, EventPoller, OperationStatus, Provider, SCEvent } from "@massalabs/massa-web3";
import { getWallets, Wallet } from "@massalabs/wallet-provider";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const CONTRACT_ADDRESS = "AS123fnc8H8MVMuiuaDiLkAeFGTobSjPvUEhJLtCjB8RQ5Dd1hkm";

export default function IncrementCounter() {
  
  // Handle provider and wallet connection
  const [provider, setProvider] = useState<Provider>(); // State for the provider
  const [wallet, setWallet] = useState<Wallet>(); // State for the wallet
  const [account, setAccount] = useState<string>(""); // State for user's account
  const [connected, setConnected] = useState<boolean>(false); // Wallet connection status

  // Handle increment and getCount functions
  const [count, setCount] = useState<bigint>(); // State to display the count from the smart contract
  const [incrementValue, setIncrementValue] = useState<number | "">(""); // State for input field
  const [isPendingInc, setIsPendingInc] = useState<boolean>(false); // Spinner state for Increment button

  // Handle event operations
  const [events, setEvents] = useState<SCEvent[]>([]); // State for events
  const [eventsStop, setEventsStop] = useState<boolean>(false); // Stop polling state

  // Shorten the blockchain address for display
  const shortenedAccount = account ? `${account.slice(0, 6)}...${account.slice(-6)}` : "";

  // Initialize provider and wallet
  const initProvider = useCallback(async () => {
    const walletList = await getWallets();
    const selectedWallet = walletList[0]; // Assuming only one wallet type, Bearby for now
    setWallet(selectedWallet);

    if (!selectedWallet) {
      toast.error("No wallet found");
      return;
    }

    const accounts = await selectedWallet?.accounts();
    setAccount(accounts[0].address);

    if (accounts.length === 0) {
      toast.error("No accounts found");
      return;
    }

    const provider = accounts[0];
    setProvider(provider);

    // MASSA EVENT POLLER setup
    const onData = (events: SCEvent[]) => {
      setEvents(events);
      for (const event of events) {
        console.log(`Event period: ${event.context.slot.period} thread: ${event.context.slot.thread} -`, event.data);
      }
    };

    const onError = (error: Error) => {
      console.error("Error:", error);
      setEventsStop(true); // Stop polling on error
      toast.error("Error during event polling");
    };

    if (!provider) {
      toast.error("Provider not initialized");
      return;
    }

    // Start the event poller
    const { stopPolling } = EventPoller.start(
      provider,
      { smartContractAddress: CONTRACT_ADDRESS },
      onData,
      onError,
      5000 // Polling interval in milliseconds
    );
  }, []);

  // Effect to initialize the provider when the component mounts
  useEffect(() => {
    initProvider();
  }, [initProvider]);

  // Effect to handle new events and display them as toast notifications
  useEffect(() => {
    const asyncEffect = async () => {
      if (events.length > 0) {
        toast.info(events.at(-1)?.data as string); // Show event data in an info toast
        setCount(await getCount());
      }
    };

    asyncEffect();
  }, [events]);

  // Connect wallet function
  async function connectWallet() {
    if (wallet) {
      const connectAction = await wallet.connect();
      setConnected(connectAction);

      if (!connectAction) {
        toast.error("Failed to connect to wallet");
        return;
      }

      setCount(await getCount());
    }
  }

  // Fetch the current count from the smart contract
  async function getCount() {
    if (!provider) {
      toast.error("No provider found");
      return BigInt(0);
    }

    const result = await provider.readSC({
      func: "getCount",
      target: CONTRACT_ADDRESS,
    });

    return new Args(result.value).nextU64();
  }

  // Handle input change for increment value
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setIncrementValue(value);
  };

  // Handle increment button click
  const handleSubmit = async (e: React.FormEvent) => {
    try {
      e.preventDefault();

      if (!provider) {
        toast.error("No provider found");
        return;
      }

      if (!incrementValue) {
        toast.warning("Please enter a number");
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
        toast.error("Failed to increment count");
        return;
      }

      setCount(await getCount());
      setIncrementValue("");
      setIsPendingInc(false);
    } catch (e) {
      console.info(e instanceof Error ? e.message : String(e));
      setIsPendingInc(false);
      toast.error("An error occurred while incrementing");
    }
  };

  // If no provider or wallet, display the relevant message
  if (!provider) {
    return (
      <div className="app-container">
        <p>Loading Provider...</p>
        <p>Please install the Bearby wallet and configure it for the Buildnet network</p>
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="app-container">
        <p>Wallet not connected...</p>
        <p>Please connect your Bearby wallet</p>
        <button onClick={connectWallet} className="connect-button">
          Connect
        </button>
  
        <style jsx>{`
          .connect-button {
            padding: 5px 10px;
            background-color: black;
            color: white;
            border-radius: 0.7em;
            cursor: pointer;
            margin-bottom: 2em;
            font-size: 16px;
          }
  
          .connect-button:hover {
            background-color: #444;
          }
        `}</style>
      </div>
    );
  }
  
  return (
    <div className="container">
      <div className="count">
        <p>{count}</p>
      </div>

      <form onSubmit={handleSubmit} className="form">
        <input
          type="number"
          name="input"
          value={incrementValue || ""}
          onChange={handleInputChange}
          placeholder="Enter number"
          className="input-field"
        />

        <div className="button-section">
          <button type="submit" className="action-button">
            Increment
            {isPendingInc && <span className="loading loading-spinner loading-xs"></span>}
          </button>
        </div>
      </form>
      <div id="userAccount" className="account">Account: {shortenedAccount}</div>
      <ToastContainer />

      <style jsx>{`
        .container {
          display:flex;
          flex-direction:column;
          text-align: center;
        }

        .title {
          color: #000;
          font-size: 2.5rem;
        }

        .form {
          display: flex;
          flex-direction:column;
          align-items: center;
          justify-content: center;
          gap:1em;
        }

        .input-field {
          width: 100%;
          margin: 0;
          padding: .4em 1em;
          border-radius: 0.7em;
          text-align:center;
        }

        .action-button {
          width: 100%;
          padding: .6em 1.5em;
          margin-bottom:1em;
          background-color: black;
          color: white;
          border-radius: 0.7em;
          cursor: pointer;
          border: none;
        }

        .action-button:hover {
            background-color: #444;
        }

        .loading-spinner {
          margin-left: 1em;
          border: 2px solid #fff;
        }

        .count {
          font-size: 3rem;
          font-weight:bold;
        }

        .button-section {
          width: 100%;
          text-aligne:center;
        }

        .account {
          margin-top: 1em;
          font-size: 1rem;
          color:#000;
          background-color:#fff;
          border-radius: 1em;
          padding:1em;
          z-index:100;
          position: fixed;
          top: 1rem;
          right: 1rem;
        }
      `}</style>
    </div>
  );
}
