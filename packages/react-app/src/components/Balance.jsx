import React, { useState, useEffect } from "react";
import { useBalance } from "eth-hooks";
import { BigNumber } from 'ethers';

const { utils } = require("ethers");
const zero = BigNumber.from(0);

/** 
  ~ What it does? ~

  Displays a balance of given address in ether & dollar

  ~ How can I use? ~

  <Balance
    address={address}
    provider={mainnetProvider}
    price={price}
  />

  ~ If you already have the balance as a bignumber ~
  <Balance
    balance={balance}
    price={price}
  />

  ~ Features ~

  - Provide address={address} and get balance corresponding to given address
  - Provide provider={mainnetProvider} to access balance on mainnet or any other network (ex. localProvider)
  - Provide price={price} of ether and get your balance converted to dollars
**/

export default function Balance(props) {
  const [dollarMode, setDollarMode] = useState(false);
  const [balance, setBalance] = useState();
  const [symbol, setSymbol] = useState();

  const {provider, address} = props;

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
        setSymbol(nativeCurrencySymbol)


        const newBalance = await provider.getBalance(address);
        console.log('\n\n');
        console.log('BALANCE INFORMATION');
        console.log('chainId', chainId);
        console.log('networkDetails', networkDetails);
        console.log('nativeCurrencySymbol', nativeCurrencySymbol);
        console.log('newBalance', newBalance);
   

        if (!newBalance.eq(balance ?? zero)) {
          setBalance(newBalance);
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
