// MY INFURA_ID, SWAP IN YOURS FROM https://infura.io/dashboard/ethereum
export const INFURA_ID = "460f40a260564ac4a4f4b3fffb032dad";

// MY ETHERSCAN_ID, SWAP IN YOURS FROM https://etherscan.io/myapikey
export const ETHERSCAN_KEY = "DNXJA8RX2Q3VZ4URQIWP7Z68CJXQZSC6AW";

// BLOCKNATIVE ID FOR Notify.js:
export const BLOCKNATIVE_DAPPID = "0b58206a-f3c0-4701-a62f-73c7243e8c77";

export const ALCHEMY_KEY = "oKxs-03sij-U_N0iOlrSsZFr29-IqbuF";

export const NETWORKS = {

  polygonAmoy: {
    name: "polygonAmoy",
    color: "#7848DF",
    chainId: 80002,
    blockExplorer: "https://amoy.polygonscan.com/",
    rpcUrl: `https://polygon-amoy-bor-rpc.publicnode.com`,
    gasPrice: 31000000000,
  },
  bsc: {
    name: "bsc",
    color: "#EABD4F",
    chainId: 97,
    blockExplorer: "https://testnet.bscscan.com/",
    rpcUrl: `https://bsc-testnet-rpc.publicnode.com	`,
    gasPrice: 1000000000,
  },
};

export const NETWORK = chainId => {
  for (const n in NETWORKS) {
    if (NETWORKS[n].chainId === chainId) {
      return NETWORKS[n];
    }
  }
};
