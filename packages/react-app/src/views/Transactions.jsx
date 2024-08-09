import React, { useCallback, useEffect, useState } from "react";
import { Button, List, Divider, Input, Card, DatePicker, Slider, Switch, Progress, Spin, notification } from "antd";
import { ConsoleSqlOutlined, SyncOutlined } from "@ant-design/icons";
import { parseEther, formatEther } from "@ethersproject/units";
import { ethers } from "ethers";
import { Address, AddressInput, Balance, Blockie, TransactionListItem } from "../components";
import { usePoller } from "eth-hooks";
import { useHistory } from "react-router-dom";
import {
  useContractReader,
} from "eth-hooks";
const axios = require("axios");

const DEBUG = false;

export default function Transactions({
  poolServerUrl,
  contractName,
  address,
  userSigner,
  mainnetProvider,
  localProvider,
  readContracts,
  writeContracts,
  blockExplorer,
}) {
  const history = useHistory();
  const [transactions, setTransactions] = useState();
  const [loading, setLoading] = useState(false);

  const signaturesRequired = useContractReader(readContracts, contractName, "required");


  const handleConfirmTransaction = async (item) => {
    if (item.hasAlreadyConfirmed) return;

    try {

      setLoading(true);

      const contract = writeContracts[contractName];
      const transaction = await contract.populateTransaction.confirmTransaction(item.txID);

      // Add 20% buffer to estimated gas limit

      const price = await localProvider.getGasPrice();
      const confirmTX = await userSigner.sendTransaction({
        to: contract.address,
        data: transaction.data,
        gasPrice: price
      });


      notification.info({
        message: "Transaction Sent",
        description: "Please wait while the transaction is being processed.",
        placement: "bottomRight",
      });



      console.log("Transaction sent:", confirmTX.hash);
      const receipt = await confirmTX.wait();



      console.log("Transaction mined. Receipt:", receipt);

      if (receipt.status === 1) {
        console.log("Transaction was successful!");
        notification.success({
          message: "Transaction Successful",
          description: "The transaction was mined and executed successfully.",
          placement: "bottomRight",
        });

        console.log("chainId", localProvider._network.chainId)
        console.log("contract.address", contract.address)
        console.log("confirmTX.hash", confirmTX.hash)
        console.log("status", "COMPLETED")

        if ((item.numberOfConfirmations + 1) == signaturesRequired) {
          let txStatus = "COMPLETED"
          const res = await axios.post(poolServerUrl + "updateStatus", {
            chainId: localProvider._network.chainId,
            address: contract.address,
            txHash: item.txHash,
            status: txStatus
          });
          console.log("BE POST RESULT", res.data);
          setLoading(false);

          setTimeout(() => {
            history.push("/history");
          }, 1000);
          return

        }


        setLoading(false);
        setTimeout(() => {
          window.location.reload();
        }, 1000);

      } else {
        console.log("Transaction failed!");
        notification.error({
          message: "Transaction Failed",
          description: "The transaction was mined but failed to execute.",
          placement: "bottomRight",
        });
      }
    } catch (error) {
      console.error("Error processing transaction:", error);
      notification.error({
        message: "Transaction Error",
        description: "An error occurred while processing the transaction.",
        placement: "bottomRight",
      });
    } finally {
      setLoading(false);

    }

    console.log(item.txID)
  };




  // const handleConfirmTransaction = useCallback(async (item) => {
  //   if (item.hasAlreadyConfirmed) return;

  //   try {
  //     setLoading(true);


  //     const contract = writeContracts[contractName];
  //     const transaction = await contract.populateTransaction.confirmTransaction(item.txID);

  //     // Add 20% buffer to estimated gas limit

  //     const price = await localProvider.getGasPrice();
  //     const priceInWei = ethers.utils.parseUnits(price.toString(), 'gwei');

  //     const confirmTX = await userSigner.sendTransaction({
  //       to: contract.address,
  //       data: transaction.data,
  //       gasPrice: 50000000000
  //     });


  //     const receipt = await confirmTX.wait();


  //     notification.info({
  //       message: "Transaction Sent",
  //       description: "Please wait while the transaction is being processed.",
  //       placement: "bottomRight",
  //     });


  //     console.log("Transaction mined. Receipt:", receipt);

  //     if (receipt.status === 1) {
  //       console.log("Transaction was successful!");
  //       notification.success({
  //         message: "Transaction Successful",
  //         description: "The transaction was mined and executed successfully.",
  //         placement: "bottomRight",
  //       });

  //       const res = await axios.post(poolServerUrl + "updateStatus", {
  //         chainId: localProvider._network.chainId,
  //         address: readContracts[contractName]?.address,
  //         txHash: confirmTX.hash,
  //         status: "COMPLETED"
  //       });

  //       console.log("BE POST RESULT", res.data);
  //       setTimeout(() => {
  //         history.push("/history");
  //       }, 1000);
  //     } else {
  //       console.log("Transaction failed!");
  //       notification.error({
  //         message: "Transaction Failed",
  //         description: "The transaction was mined but failed to execute.",
  //         placement: "bottomRight",
  //       });
  //     }
  //   } catch (error) {
  //     console.error("Error processing transaction:", error);
  //     notification.error({
  //       message: "Transaction Error",
  //       description: "An error occurred while processing the transaction.",
  //       placement: "bottomRight",
  //     });
  //   } finally {
  //     setLoading(false);
  //   }
  // }, [writeContracts, contractName, poolServerUrl, localProvider]);

  const getTransactions = useCallback(async () => {
    if (!readContracts[contractName]) return;

    try {
      const res = await axios.get(
        `${poolServerUrl}${readContracts[contractName].address}_${localProvider._network.chainId}`
      );


      const newTransactions = await Promise.all(
        Object.values(res.data)
          .filter(txData => txData.status === "PENDING")
          .map(async txData => {
            const txID = ethers.BigNumber.from(txData.txID).toNumber();
            const getConfirmations = await readContracts[contractName].getConfirmations(txID);
            const numberOfConfirmations = getConfirmations.length;
            const normalizedAddressToCheck = address.toLowerCase();
            const hasAlreadyConfirmed = getConfirmations.some(addr => addr.toLowerCase() === normalizedAddressToCheck);
            const isOwner = await readContracts[contractName].isOwner(address);

            return {
              ...txData,
              isOwner,
              txID,
              numberOfConfirmations,
              hasAlreadyConfirmed,
            };
          })
      );

      setTransactions(newTransactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  }, [poolServerUrl, readContracts, contractName, localProvider, address]);

  useEffect(() => {
    getTransactions();
  }, [address]);

  usePoller(getTransactions, 10000);


  const getSortedSigList = async (allSigs, newHash) => {
    const sigList = [];
    for (const sig in allSigs) {
      const recover = await readContracts[contractName].recover(newHash, allSigs[sig]);
      sigList.push({ signature: allSigs[sig], signer: recover });
    }

    sigList.sort((a, b) => {
      return ethers.BigNumber.from(a.signer).sub(ethers.BigNumber.from(b.signer));
    });

    const finalSigList = [];
    const finalSigners = [];
    const used = {};
    for (const sig in sigList) {
      if (!used[sigList[sig].signature]) {
        finalSigList.push(sigList[sig].signature);
        finalSigners.push(sigList[sig].signer);
      }
      used[sigList[sig].signature] = true;
    }

    return [finalSigList, finalSigners];
  };

  if (!signaturesRequired || !transactions) {
    return <Spin style={{ marginTop: '30px', }} />;
  }



  return (
    <div style={{ maxWidth: 850, margin: "auto", marginTop: 32, marginBottom: 32 }}>
      <h1>
        <b style={{ padding: 16 }}>Pending Transactions</b>
      </h1>

      <List
        bordered
        dataSource={transactions}
        renderItem={item => {
          const hasSigned = item.hasAlreadyConfirmed;
          const hasEnoughSignatures = item.numberOfConfirmations <= signaturesRequired.toNumber();

          // console.log("transaction details:", item);

          return (
            <TransactionListItem
              item={item}
              mainnetProvider={mainnetProvider}
              blockExplorer={blockExplorer}
              readContracts={readContracts}
              contractName={contractName}
            >
              <div style={{ padding: 16 }}>
                <span style={{ padding: 4 }}>
                  {item.numberOfConfirmations}/{signaturesRequired.toNumber()} {hasSigned ? "✅" : ""}
                </span>
                <span style={{ padding: 4 }}>
                  <Button
                    type={hasSigned ? "secondary" : "primary"}
                    loading={loading}
                    onClick={() => handleConfirmTransaction(item)}
                    disabled={hasSigned}
                  >
                    {hasSigned ? "Confirmed" : "Confirm"}
                  </Button>

                </span>
              </div>
            </TransactionListItem>


          );
        }}
      />


    </div>
  );
}
