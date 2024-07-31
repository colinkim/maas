import React, { useState, useEffect, useRef } from "react";
import { useBalance } from "eth-hooks";
import { BigNumber, Contract } from 'ethers';

const { utils } = require("ethers");
const zero = BigNumber.from(0);
let balanceCount = 0;
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


  useEffect(() => {
    async function getBalance() {

      if (provider && address) {
        const getNativeCurrencySymbol = async (provider) => {
          try {
            const network = await provider.getNetwork();

            // Most providers expose the native currency symbol directly
            if (network.nativeCurrency && network.nativeCurrency.symbol) {
              return network.nativeCurrency.symbol;
            }

            // Fallback: use common symbols for well-known networks
            switch (network.chainId) {
              case 1: return 'ETH';  // Ethereum Mainnet
              case 137: return 'MATIC';  // Polygon
              case 56: return 'BNB';  // Binance Smart Chain
              case 43114: return 'AVAX';  // Avalanche
              case 42161: return 'ETH';  // Arbitrum
              case 10: return 'ETH';  // Optimism
              case 80002: return 'tMATIC';  // Optimism
              case 97: return 'tBNB';  // Optimism
              // Add more cases as needed
              default: return 'Unknown';
            }
          } catch (error) {
            console.error('Error getting native currency symbol:', error);
            return 'Unknown';
          }
        };


        const nativeCurrencySymbol = await getNativeCurrencySymbol(provider);
        console.log('Native currency symbol:', nativeCurrencySymbol);

        const fetchBalance = async (address, tokenAddress = null) => {
          try {
            if (!tokenAddress) {
              const balance = await provider.getBalance(address);
              return { balance, symbol: nativeCurrencySymbol };
            } else {
              const tokenContract = new Contract(tokenAddress, ERC20_ABI, provider);
              const balance = await tokenContract.balanceOf(address);
              const symbol = await tokenContract.symbol();
              return { balance, symbol };
            }
          } catch (error) {
            console.error('Error fetching balance:', error);
            return null;
          }
        };

        const updateBalance = async () => {
          const storedSelectedToken = localStorage.getItem('selectedToken');
          console.log('Stored selected token:', storedSelectedToken);

          let tokenAddress = null;

          if (storedSelectedToken) {
            try {
              const parsedToken = JSON.parse(storedSelectedToken);
              tokenAddress = parsedToken?.address;
            } catch (error) {
              console.error('Error parsing stored token:', error);
            }
          }

          const result = await fetchBalance(address, tokenAddress);

          if (result) {
            setBalance(result.balance);
            setSymbol(result.symbol);
          } else {
            // Fallback to native currency if there's an error
            const defaultResult = await fetchBalance(address);
            setBalance(defaultResult.balance);
            setSymbol(defaultResult.symbol);
          }
        };
        updateBalance();

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