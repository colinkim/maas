import React, { useEffect, useState, useRef } from "react";
import { useHistory } from "react-router-dom";
import { Button, Input, Select, InputNumber, Space, Tooltip, notification } from "antd";
import { CodeOutlined } from '@ant-design/icons';
import { AddressInput, Balance, } from "../components";
import TransactionDetailsModal from "../components/MultiSig/TransactionDetailsModal";
import { parseExternalContractTransaction } from "../helpers";
import { useLocalStorage } from "../hooks";
import { ethers } from "ethers";
import { parseEther } from "@ethersproject/units";
import {
  useContractReader,
} from "eth-hooks";
const { Option } = Select;

const axios = require("axios");

const erc20ABI = [{
  constant: false,
  inputs: [
    {
      name: "_to",
      type: "address"
    },
    {
      name: "_value",
      type: "uint256"
    }
  ],
  name: "transfer",
  outputs: [
    {
      name: "",
      type: "bool"
    }
  ],
  payable: false,
  stateMutability: "nonpayable",
  type: "function"
},
{
  constant: false,
  inputs: [
    {
      name: "ownder",
      type: "address"
    }
  ],
  name: "addOwner",
  outputs: [
    {
      name: "",
      type: "bool"
    }
  ],
  payable: false,
  stateMutability: "nonpayable",
  type: "function"
},
{
  constant: false,
  inputs: [
    {
      name: "ownder",
      type: "address"
    }
  ],
  name: "removeOwner",
  outputs: [
    {
      name: "",
      type: "bool"
    }
  ],
  payable: false,
  stateMutability: "nonpayable",
  type: "function"
},
{
  constant: false,
  inputs: [
    {
      name: "_required",
      type: "uint256"
    }
  ],
  name: "changeRequirement",
  outputs: [
    {
      name: "",
      type: "bool"
    }
  ],
  payable: false,
  stateMutability: "nonpayable",
  type: "function"
}];



export default function CreateTransaction({
  poolServerUrl,
  contractName,
  contractAddress,
  mainnetProvider,
  localProvider,
  readContracts,
  writeContracts,
  userSigner,
  executeTransactionEvents,
  blockExplorer,
  currentMultiSigName
}) {
  const history = useHistory();
  const signaturesRequired = useContractReader(readContracts, contractName, "required");
  const [methodName, setMethodName] = useLocalStorage("methodName", "transferFunds")
  const [newSignaturesRequired, setNewSignaturesRequired] = useState(signaturesRequired)
  const [amount, setAmount] = useState();
  const [recipient, setRecipient] = useLocalStorage("recipient");
  const [loading, setLoading] = useState(false);
  const [hasEdited, setHasEdited] = useState()

  function isValidEthereumAddress(input) {
    try {
      const address = ethers.utils.getAddress(input);
      return true;
    } catch (error) {
      return false;
    }
  }


  useEffect(() => {
    if (!hasEdited) {
      setNewSignaturesRequired(signaturesRequired)
    }
  }, [signaturesRequired])


  const inputStyle = {
    padding: 10,
  };

  // useEffect(() => {
  //   const getParsedTransaction = async () => {
  //     const parsedTransaction = await parseExternalContractTransaction(to, customCallData);
  //     setParsedCustomCallData(parsedTransaction);
  //   }

  //   getParsedTransaction();
  // }, [customCallData]);

  function getTextInParentheses(str) {
    const match = str.match(/\((.*?)\)/);
    return match ? match[1] : null;
  }
  function getSelectedTokenInfo() {
    const storedSelectedToken = localStorage.getItem('selectedToken');
    const storedSelectedTokenAddress = localStorage.getItem('selectedTokenAddress');

    console.log("Stored token info:", { storedSelectedToken, storedSelectedTokenAddress });

    let isUsingNative = true;
    let tokenContract = "";
    let tokenSymbol = "";

    if (storedSelectedToken && storedSelectedTokenAddress) {
      try {
        const parsedToken = JSON.parse(storedSelectedToken);
        if (parsedToken && storedSelectedTokenAddress) {
          isUsingNative = false;
          tokenContract = storedSelectedTokenAddress;
          tokenSymbol = getTextInParentheses(parsedToken.name)
          console.log("Using token:", tokenContract);
        } else {
          console.warn("Incomplete token information, defaulting to native currency");
        }
      } catch (error) {
        console.error("Error parsing stored token:", error);
        console.warn("Defaulting to native currency due to parsing error");
      }
    } else {
      console.log("No token selected, using native currency");
    }

    return { isUsingNative, tokenContract, tokenSymbol };
  }

  const createTransaction = async () => {
    try {
      if (newSignaturesRequired < 1) {
        notification.error({
          message: "Invalid Signatures Required",
          description: "Signatures required must be >= 1",
          placement: "bottomRight",
        });
        return;
      }

      setLoading(true);

      const parsedRecipient = recipient.replace(/\s/g, '');
      setRecipient(parsedRecipient);

      if (!isValidEthereumAddress(parsedRecipient)) {
        notification.error({
          message: "Invalid Address",
          description: "Please Check the Address",
          placement: "bottomRight",
        });
        setLoading(false);
        return;
      }

      if (!(parseFloat(amount) > 0) && (methodName == "transferFunds")) {
        notification.error({
          message: "Invalid Amount",
          description: "Please Check the Amount",
          placement: "bottomRight",
        });
        setLoading(false);
        return;
      }

      let transferSymbol = "";
      let transferTarget = "";
      let encodedData = "";
      let transferAmount = 0;

      const transactionID = await readContracts[contractName].transactionCount();
      const { isUsingNative, tokenContract, tokenSymbol } = getSelectedTokenInfo();
      const erc20Interface = new ethers.utils.Interface(erc20ABI);

      if (methodName == "transferFunds") {
        if (isUsingNative) {
          transferSymbol = localStorage.getItem('nativeCoinSymbol');
          encodedData = "0x00"
          transferTarget = parsedRecipient
        } else {
          transferSymbol = tokenSymbol
          encodedData = erc20Interface.encodeFunctionData("transfer", [
            parsedRecipient,
            ethers.utils.parseUnits(parseFloat(amount).toFixed(12), 18)
          ]);

          transferTarget = tokenContract
        }
        console.log("isUsingNative", isUsingNative);
        console.log("tokenContract", tokenContract);
        console.log("transferSymbol", transferSymbol);

      } else if (methodName == "addOwner") {
        encodedData = erc20Interface.encodeFunctionData("addOwner", [parsedRecipient]);
        transferTarget = contractAddress
      }
      else if (methodName == "removeOwner") {
        encodedData = erc20Interface.encodeFunctionData("removeOwner", [parsedRecipient]);
        transferTarget = contractAddress
      } else {
        if (hasEdited) {
          encodedData = erc20Interface.encodeFunctionData("changeRequirement", [newSignaturesRequired]);
          transferTarget = contractAddress

        } else {
          notification.info({
            message: "Required Signatures Not Changed",
            description: "Update the value first.",
            placement: "bottomRight",
          });
          return;

        }
      }


      const contract = writeContracts[contractName];
      const transaction = await contract.populateTransaction.submitTransaction(
        transferTarget,
        transferAmount,
        encodedData
      );


      const price = await localProvider.getGasPrice();
      // Send the transaction
      const tx = await userSigner.sendTransaction({
        to: contract.address,
        data: transaction.data,
        gasPrice: price
      });




      console.log("CREATE TRANSACTION\n");
      console.log("encodedData", encodedData);

      // const tx = await writeContracts[contractName].submitTransaction(
      //   transferTarget,
      //   transferAmount,
      //   encodedData
      // );

      console.log("Transaction sent:", tx.hash);

      notification.info({
        message: "Transaction Sent",
        description: `Please wait while the transaction is being processed.`,
        placement: "bottomRight",
      });

      try {
        const receipt = await tx.wait();
        console.log("Transaction mined. Receipt:", receipt);

        if (receipt.status === 1) {
          console.log("Transaction was successful!");
          notification.success({
            message: "Transaction Successful",
            description: "The transaction was mined and executed successfully.",
            placement: "bottomRight",
          });

          let txStatus = "PENDING"

          if (signaturesRequired === 1) {
            txStatus = "COMPLETE";

          }

          const res = await axios.post(poolServerUrl, {
            chainId: localProvider._network.chainId,
            address: readContracts[contractName]?.address,
            methodName: methodName,
            targetAddress: parsedRecipient,
            txHash: tx.hash,
            txID: transactionID,
            transferAmount: amount,
            transferSymbol: transferSymbol,
            blockExplorer: blockExplorer,
            status: "PENDING",
            newSignaturesRequired: newSignaturesRequired
          });

          console.log("BE POST RESULT", res.data);
          setTimeout(() => {
            history.push("/pending");
            setLoading(false);
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
      }



    } catch (error) {
      console.log("Error: ", error);
      notification.error({
        message: "Transaction Error",
        description: error.message,
        placement: "bottomRight",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 850, margin: "auto", marginTop: 32, marginBottom: 32 }}>

      <h1>
        <b style={{ padding: 16 }}>Create Transactions</b>
      </h1>


      <div style={{ borderRadius: '4px', border: "1px solid #cccccc", padding: 16, width: 500, margin: "auto", }}>
        <div style={{ margin: 8 }}>


          <p style={{ fontSize: '18px', marginBottom: '0' }}><b>{currentMultiSigName} - Wallet Balance</b></p>
          <Balance
            address={contractAddress ? contractAddress : ""}
            provider={localProvider}
            size={18}
          />


          <div style={{ marginTop: 10, padding: 10 }}>
            <Select value={methodName} style={{ width: "100%" }} onChange={setMethodName}>
              <Option key="transferFunds"><b>Send Coin/Token</b></Option>
              <Option key="addOwner"><b>Add Owner</b></Option>
              <Option key="removeOwner"><b>Remove Owner</b></Option>
              <Option key="changeRequirement"><b>Update Signature Requirements</b></Option>

              {/* <Option key="customCallData">Custom Call Data</Option>
              <Option key="wcCallData">
                <img src="walletconnect-logo.svg" style={{ height: 20, width: 20 }} /> WalletConnect
              </Option> */}
            </Select>
          </div>
          <>
            <div style={inputStyle}>
              {(methodName == "transferFunds" || methodName == "addOwner" || methodName == "removeOwner") &&

                <AddressInput
                  autoFocus
                  ensProvider={mainnetProvider}
                  placeholder={methodName == "transferFunds" ? "Recepient Address" : "Owner Address"}
                  value={recipient}
                  onChange={setRecipient}
                />
              }

            </div>
            <div style={inputStyle}>
              {(methodName == "changeRequirement") &&


                <InputNumber
                  style={{ width: "100%" }}
                  placeholder="New # of signatures required"
                  value={newSignaturesRequired}
                  onChange={(value) => {
                    setNewSignaturesRequired(value)
                    setHasEdited(true)
                  }}
                />
              }
              {(methodName == "transferFunds") &&
                <InputNumber
                  style={{ width: "100%" }}
                  placeholder="Amount to Send"
                  onChange={(value) => {
                    setAmount(value)
                  }}

                />
              }
            </div>
            <Space style={{ marginTop: 32 }}>
              <Button
                loading={loading}
                onClick={createTransaction}
                type="primary"
              >
                Propose
              </Button>
            </Space>
          </>
        </div>



      </div>
    </div >


  );
}
