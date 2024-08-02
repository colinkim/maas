import React, { useState, useEffect, useRef, useCallback } from "react";
import { useBalance } from "eth-hooks";
import { BigNumber, Contract } from 'ethers';
import { Select, List, Spin, Collapse, Tag } from "antd";

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

  const getNativeCurrencySymbol = async (provider) => {
    try {
      const network = await provider.getNetwork();

      if (network.nativeCurrency && network.nativeCurrency.symbol) {
        return network.nativeCurrency.symbol;
      }

      switch (network.chainId) {
        case 1: return 'ETH';
        case 137: return 'MATIC';
        case 56: return 'BNB';
        case 43114: return 'AVAX';
        case 42161: return 'ETH';
        case 10: return 'ETH';
        case 80002: return 'tMATIC';
        case 97: return 'tBNB';
        default: return 'Unknown';
      }
    } catch (error) {
      console.error('Error getting native currency symbol:', error);
      return 'Unknown';
    }
  };

  const fetchBalance = async (address, tokenAddress = null) => {
    try {
      if (!tokenAddress) {
        const balance = await provider.getBalance(address);
        const nativeCurrencySymbol = await getNativeCurrencySymbol(provider);
        localStorage.setItem('nativeCoinSymbol', nativeCurrencySymbol);

        return { balance, symbol: nativeCurrencySymbol };
      } else {
        const tokenContract = new Contract(tokenAddress, ERC20_ABI, provider);
        const balance = await tokenContract.balanceOf(address);
        const symbol = await tokenContract.symbol();
        localStorage.setItem('nativeCoinSymbol', "");

        return { balance, symbol };
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
      return null;
    }
  };

  const getBalance = useCallback(async () => {
    if (provider && address) {
      const storedSelectedToken = localStorage.getItem('selectedToken');
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
        localStorage.setItem('selectedTokenAddress', tokenAddress);
      } else {
        const defaultResult = await fetchBalance(address);
        setBalance(defaultResult.balance);
        setSymbol(defaultResult.symbol);
        localStorage.setItem('selectedTokenAddress', "");


      }
    }
  }, [provider, address]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      getBalance();
    }, 10000);

    getBalance();

    return () => clearInterval(intervalId);
  }, [getBalance]);


  // useEffect(() => {

  //   if (balance) {
  //     console.log("ADDRESS: ", address)
  //     console.log("BALANCE: ", balance.toString())
  //   }


  // }, [balance]);


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

  if (!symbol) {
    return <Spin style={{ marginRight: '10px', marginTop: '5px' }} />;
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