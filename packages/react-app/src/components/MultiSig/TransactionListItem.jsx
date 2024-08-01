import React, { useState, useEffect } from "react";
import { Button, List } from "antd";

import { Address, Balance, Blockie } from "..";
import TransactionDetailsModal from "./TransactionDetailsModal";
import { EllipsisOutlined } from "@ant-design/icons";
import { ethers } from "ethers";
import { parseEther } from "@ethersproject/units";
import { parseExternalContractTransaction } from "../../helpers";

const axios = require("axios");

export default function TransactionListItem({ item, mainnetProvider, blockExplorer, price, readContracts, contractName, children }) {
  //console.log("coming in item:", item);
  item = item.args ? item.args : item;

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [txnData, setTxnData] = useState({});

  const showModal = () => {
    setIsModalVisible(true);
  };




  const txDisplay = () => {
    const toSelf = (item?.to == readContracts[contractName].address)

    if (item.methodName == "addOwner") {
      return (
        <>
          <span style={{ fontSize: 16, fontWeight: "bold" }}>
            Add Signer
          </span>
          {ethers.utils.isAddress(item.targetAddress) &&
            <Address address={item.targetAddress} blockExplorer={blockExplorer} fontSize={16} />
          }

          <>
            {
              children
            }
          </>
        </>
      )
    }
    else if (item.methodName == "removeOwner") {
      return (
        <>
          <span style={{ fontSize: 16, fontWeight: "bold" }}>
            Remove Signer
          </span>
          {ethers.utils.isAddress(item.targetAddress) &&
            <Address address={item.targetAddress} blockExplorer={blockExplorer} fontSize={16} />
          }
          <>
            {
              children
            }
          </>
        </>
      )
    } else if (item.methodName == "transferFunds") {
      return (
        <>
          <span style={{ fontSize: 16, fontWeight: "bold" }}>
            Transfer
          </span>

          <span style={{ fontSize: 16, fontWeight: "bold" }}>
            {item.transferAmount} {item.transferSymbol}
          </span>
          <b>To</b>
          <Address address={item.targetAddress} blockExplorer={blockExplorer} fontSize={16} />
          <>
            {
              children
            }
          </>
        </>
      )
    }
  }

  return <>
    {/* <TransactionDetailsModal
      visible={isModalVisible}
      txnInfo={txnData[item.hash]}
      handleOk={() => setIsModalVisible(false)}
      handleCancel={() => setIsModalVisible(false)}
      mainnetProvider={mainnetProvider}
      price={price}
    /> */}
    {<List.Item
      key={item.hash}
      style={{ position: "relative", display: "flex", flexWrap: "wrap", width: 800 }}
    >
      <>
        <a href={blockExplorer + "tx/" + item.txHash} target="_blank">
          <b style={{ padding: 16 }}>#{typeof (item.txID) === "number" ? item.txID : item.txID.toNumber()}</b>
        </a>
        {txDisplay()}
        <Blockie size={4} scale={8} address={item.txHash} />
      </>
    </List.Item>}
  </>
};
