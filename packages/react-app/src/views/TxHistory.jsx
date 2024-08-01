import React, { useCallback, useEffect, useState } from "react";
import { List } from "antd";
import { TransactionListItem } from "../components";
import { usePoller } from "eth-hooks";
import { ethers } from "ethers";

const axios = require("axios");

export default function Transactions({
  poolServerUrl,
  contractName,
  signaturesRequired,
  address,
  userSigner,
  mainnetProvider,
  localProvider,
  gasPriceDouble,
  tx,
  readContracts,
  writeContracts,
  blockExplorer,
}) {
  const [transactions, setTransactions] = useState();

  usePoller(() => {
    const getTransactions = async () => {
      try {
        const res = await axios.get(
          poolServerUrl + readContracts[contractName].address + "_" + localProvider._network.chainId
        );

        console.log("backend stuff res", res.data);

        const newTransactions = [];
        for (const key in res.data) {

          console.log("backend stuff res.data[key]", res.data[key]);
          const txData = res.data[key];
          if (txData.status == "COMPLETED") {
            const txID = ethers.BigNumber.from(txData.txID).toNumber();
            const updatedTxData = {
              ...txData,
              txID,
            };

            newTransactions.push(updatedTxData);


          }


        }

        console.log("backend stuff newTransactions", newTransactions);

        setTransactions(newTransactions);
      } catch (error) {
        console.error("Error fetching transactions:", error);
      }
    };
    if (readContracts[contractName]) getTransactions();
  }, 10000);

  return (
    <div style={{ maxWidth: 850, margin: "auto", marginTop: 32, marginBottom: 32 }}>
      <h1>
        <b style={{ padding: 16 }}>Transaction History</b>
      </h1>

      <List
        bordered
        dataSource={transactions}
        renderItem={item => {
          return (
            <TransactionListItem
              item={item}
              mainnetProvider={mainnetProvider}
              blockExplorer={blockExplorer}
              readContracts={readContracts}
              contractName={contractName}
            >

            </TransactionListItem>


          );
        }}
      />






    </div>
  );
}
