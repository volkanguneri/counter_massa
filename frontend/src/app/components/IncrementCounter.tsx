/**
 * @title IncrementCounter Component
 * @dev React component to interact with a Massa Labs smart contract. It allows users to
 *      increment a counter value stored in the blockchain, retrieve the current counter value and display events.
 * 
 * @notice This component uses Massa's SDK to connect to the blockchain, fetch the counter state,
 *         and submit transactions to increment the counter.
 */

import { useState, useEffect, useCallback } from "react"; 
import { Args, EventPoller, OperationStatus, Provider, SCEvent } from "@massalabs/massa-web3";
import { getWallets, Wallet } from "@massalabs/wallet-provider";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function IncrementCounter() {
 
  const [provider, setProvider] = useState<Provider>(); //Stores the provider instance to interact with the blockchain.
  const [wallet, setWallet] = useState<Wallet>(); //Stores the wallet instance to manage user accounts and transactions.
  const [account, setAccount] = useState<string>(""); //Stores the user's wallet address.
  const [connected, setConnected] = useState<boolean>(false); //Indicates whether the wallet is connected to the blockchain.
  const [count, setCount] = useState<bigint>(); //Stores the current counter value retrieved from the smart contract.
  const [incrementValue, setIncrementValue] = useState<number | "">(""); //The value to increment the counter by, input by the user.
  const [isPendingInc, setIsPendingInc] = useState<boolean>(false); //Spinner state for the increment operation.
  const [events, setEvents] = useState<SCEvent[]>([]); //Stores smart contract events retrieved during polling.

  /**
   * @dev The address of the smart contract on the Massa blockchain.
   */
    const CONTRACT_ADDRESS : string = "AS12b4pgVgvF9GKL6S8wZ6AEKENeqihZ8Qmxkr5NT4Ho7wYp9D9NT";

  /**
   * @dev Shortens the user's blockchain address.
   */
  const shortenedAccount : string = account ? `${account.slice(0, 6)}...${account.slice(-6)}` : "";

  /**
   * @dev Initializes the provider and wallet connection and sets up event polling for smart contract events.
   * @issue as initProvider is listened and called by a useEffect hook, need useCallback to prevent impermanent loop
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
     * @dev Massa Event Poller setup
     * @issue Should not be in init provider but if outside, error caused by useEffect listenning events
     */
    const onData = (events: SCEvent[]) => {
      setEvents(events);
      for (const event of events) {
        console.log("🚀 ~ onData ~ event data :", event.data )
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

    /** 
    * @issue can't use stopPolling as scheduler is not installed 
    */
    const { stopPolling } = EventPoller.start(
      provider,
      { smartContractAddress: CONTRACT_ADDRESS },
      onData,
      onError,
      5000 // Polling interval in milliseconds
    );
    console.log("🚀 ~ initProvider ~ stopPolling:", stopPolling);

    // Continue polling until stopped
    // while (!stop) {
    //   await scheduler.wait(5000);
    // }
    // stopPolling();
  },[]);

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
      if (events.length > 0) {
        toast.info(events.at(-1)?.data as string); // Show event data in an info toast
      }
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
   * If no provider or wallet, display the relevant message
   * @returns JSX Elements for Increment Counter functionality.
   */

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
