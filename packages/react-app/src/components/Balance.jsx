import React, { useState, useEffect } from "react";
import { useBalance } from "eth-hooks";
import { BigNumber, Contract } from 'ethers';

const { utils } = require("ethers");
const zero = BigNumber.from(0);

// ABI for ERC20 token balance function
const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    type: "function",
  },
];

export default function Balance(props) {
  const [dollarMode, setDollarMode] = useState(false);
  const [balance, setBalance] = useState();
  const [symbol, setSymbol] = useState();

  const { provider, address } = props;

  const balanceContract = useBalance(props.provider, props.address);
  useEffect(() => {
    setBalance(balanceContract);
  }, [balanceContract]);

  useEffect(() => {
    async function getBalance() {
      if (provider && address) {

        const network = await provider.getNetwork();
        const chainId = network.chainId;


        // Fetch the list of known networks
        const response = await fetch('https://chainid.network/chains.json');
        const networks = await response.json();

        // Find the network details based on the chain ID
        const networkDetails = networks.find(net => net.chainId === chainId);

        // Define a variable for the native currency symbol
        let nativeCurrencySymbol = "Unknown";

        // If the network is found, get the native currency symbol
        if (networkDetails && networkDetails.nativeCurrency) {
          nativeCurrencySymbol = networkDetails.nativeCurrency.symbol;
        }

        const storedSelectedToken = localStorage.getItem('selectedToken');
        console.log('Stored selected token:', storedSelectedToken);

        if (!storedSelectedToken) {
          const newBalance = await provider.getBalance(address);
          setBalance(newBalance);
          setSymbol(nativeCurrencySymbol);
        } else {
          let parsedToken;
          try {
            parsedToken = JSON.parse(storedSelectedToken);
          } catch (e) {
            console.error('Error parsing stored token:', e);
            // Handle error, e.g., reset balance and symbol to default
            const newBalance = await provider.getBalance(address);
            setBalance(newBalance);
            setSymbol(nativeCurrencySymbol);
            return;
          }

          if (!parsedToken || !parsedToken.address) {
            console.error('Parsed token is null or does not have an address property.');
            const newBalance = await provider.getBalance(address);
            setBalance(newBalance);
            setSymbol(nativeCurrencySymbol);
          } else {
            console.log(parsedToken.address);
            const tokenContract = new Contract(parsedToken.address, ERC20_ABI, provider);
            const tokenBalance = await tokenContract.balanceOf(address);
            const tokenSymbol = await tokenContract.symbol();
            setBalance(tokenBalance);
            setSymbol(tokenSymbol);
          }
        }

      }
    }
    getBalance();
  }, [address, provider]);

  let floatBalance = parseFloat("0.00");
  let usingBalance = balance;

  if (typeof props.balance !== "undefined") usingBalance = props.balance;
  if (typeof props.value !== "undefined") usingBalance = props.value;

  if (usingBalance) {
    const etherBalance = utils.formatEther(usingBalance);
    parseFloat(etherBalance).toFixed(2);
    floatBalance = parseFloat(etherBalance);
  }

  let displayBalance = floatBalance.toFixed(4);

  const price = props.price || props.dollarMultiplier || 1;

  if (dollarMode) {
    displayBalance = "$" + (floatBalance * price).toFixed(2);
  }

  return (
    <span
      style={{
        verticalAlign: "middle",
        fontSize: props.size ? props.size : 24,
        padding: "0 0.5rem",
        cursor: "pointer",
      }}

    >
      {displayBalance} <b>{symbol}</b>
    </span>
  );
}
