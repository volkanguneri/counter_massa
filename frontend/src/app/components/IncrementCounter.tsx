/**
 * @title IncrementCounter Component
 * @dev React component to interact with a Massa Labs smart contract. It allows users to
 *      increment a counter value stored in the blockchain and retrieve the current counter value.
 * 
 * @notice This component uses Massa's SDK to connect to the blockchain, fetch the counter state,
 *         and submit transactions to increment the counter.
 * 
 * @fileoverview
 *  - Connects to the Massa blockchain using Massa's SDK.
 *  - Handles user interactions to increment the counter.
 *  - Displays the current counter value and wallet address.
 *  - Polls for smart contract events and displays them.
 */

import { useState, useEffect, useCallback } from "react"; 
import { Args, EventPoller, OperationStatus, Provider, SCEvent } from "@massalabs/massa-web3";
import { getWallets, Wallet } from "@massalabs/wallet-provider";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

/**
 * @constant CONTRACT_ADDRESS
 * @type {string}
 * @dev The address of the smart contract on the Massa blockchain.
 */
const CONTRACT_ADDRESS : string = "AS12b4pgVgvF9GKL6S8wZ6AEKENeqihZ8Qmxkr5NT4Ho7wYp9D9NT";

export default function IncrementCounter() {
  /**
   * @state {Provider} provider
   * @dev Stores the provider instance to interact with the blockchain.
   */
  const [provider, setProvider] = useState<Provider>();

  /**
   * @state {Wallet} wallet
   * @dev Stores the wallet instance to manage user accounts and transactions.
   */
  const [wallet, setWallet] = useState<Wallet>();

  /**
   * @state {string} account
   * @dev Stores the user's wallet address.
   */
  const [account, setAccount] = useState<string>("");

  /**
   * @state {boolean} connected
   * @dev Indicates whether the wallet is connected to the blockchain.
   */
  const [connected, setConnected] = useState<boolean>(false);

  /**
   * @state {bigint} count
   * @dev Stores the current counter value retrieved from the smart contract.
   */
  const [count, setCount] = useState<bigint>();

  /**
   * @state {number | ""} incrementValue
   * @dev The value to increment the counter by, input by the user.
   */
  const [incrementValue, setIncrementValue] = useState<number | "">("");

  /**
   * @state {boolean} isPendingInc
   * @dev Spinner state for the increment operation.
   */
  const [isPendingInc, setIsPendingInc] = useState<boolean>(false);

  /**
   * @state {SCEvent[]} events
   * @dev Stores smart contract events retrieved during polling.
   */
  const [events, setEvents] = useState<SCEvent[]>([]);

  /**
   * @constant shortenedAccount
   * @type {string}
   * @dev Shortens the user's blockchain address for display purposes.
   */
  const shortenedAccount : string = account ? `${account.slice(0, 6)}...${account.slice(-6)}` : "";

  /**
   * @function initProvider
   * @dev Initializes the provider and wallet connection.
   *       Sets up event polling for smart contract events.
   */
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

    /**
     * @dev MASSA EVENT POLLER setup
     */
    const onData = (events: SCEvent[]) => {
      setEvents(events);
      for (const event of events) {
        console.log(`Event period: ${event.context.slot.period} thread: ${event.context.slot.thread} -`, event.data);
      }
    };

    const onError = (error: Error) => {
      console.error("Error:", error);
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
    console.log("🚀 ~ initProvider ~ stopPolling:", stopPolling);
  }, []);

  /**
   * @dev Initializes the provider when the component mounts.
   */
  useEffect(() => {
    initProvider();
  }, [initProvider]);

  /**
   * @dev Listens for new events and updates the counter when events occur.
   */
  useEffect(() => {
    const asyncEffect = async () => {
      if (events.length > 0) {
        toast.info(events.at(-1)?.data as string); // Show event data in an info toast
        setCount(await getCount());
      }
    };
    asyncEffect();
  }, [events]);

  /**
   * @dev Connects the user's wallet to the blockchain and fetches the current counter value.
   */
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

  /**
   * @dev Fetches the current counter value from the smart contract.
   */
  async function getCount() : Promise<bigint> {
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

  /**
   * @function handleInputChange
   * @param {React.ChangeEvent<HTMLInputElement>} e
   * @dev Updates the state with the user-input increment value.
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setIncrementValue(value);
  };

  /**
   * @param {React.FormEvent} e
   * @dev Sends a transaction to increment the counter in the smart contract.
   */
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

  /**
   * @dev Renders the UI components based on wallet and provider status.
   * @returns JSX Elements for Increment Counter functionality.
   */
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
