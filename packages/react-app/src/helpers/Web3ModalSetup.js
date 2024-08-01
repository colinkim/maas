import Fortmatic from "fortmatic";
import WalletLink from "walletlink";
import Web3Modal from "web3modal";
import Portis from "@portis/web3";
import WalletConnectProvider from "@walletconnect/web3-provider";
import Authereum from "authereum";
import { INFURA_ID, ALCHEMY_KEY } from "../constants";

// // Coinbase walletLink init
// const walletLink = new WalletLink({
//   appName: "coinbase",
// });

// // WalletLink provider
// const walletLinkProvider = walletLink.makeWeb3Provider(`https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_KEY}`, 1);

// Portis ID: 6255fb2b-58c8-433b-a2c9-62098c05ddc9
/**
  Web3 modal helps us "connect" external wallets:
**/
const web3ModalSetup = () =>
  new Web3Modal({
    network: "mainnet", // Optional. If using WalletConnect on xDai, change network to "xdai" and add RPC info below for xDai chain.
    cacheProvider: true, // optional
    theme: "light", // optional. Change to "dark" for a dark theme.
    providerOptions: {


    },
  });

export default web3ModalSetup;
