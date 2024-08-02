import { Button, Modal, Spin, Tooltip, Typography, Select, Input, message } from "antd";
import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { KeyOutlined, QrcodeOutlined, SendOutlined, WalletOutlined, CreditCardFilled } from "@ant-design/icons";
import QR from "qrcode.react";

import { Transactor } from "../helpers";
import Address from "./Address";
import AddressInput from "./AddressInput";
import Balance from "./Balance";
import EtherInput from "./EtherInput";

const { Text, Paragraph } = Typography;
const { Option } = Select;
let BACKEND_URL = process.env.REACT_APP_BACKEND_SERVER;

// ABI for ERC20 token name and symbol functions
const ERC20_ABI = [
  {
    constant: true,
    inputs: [],
    name: "name",
    outputs: [{ name: "", type: "string" }],
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

export default function Wallet(props) {
  const [signerAddress, setSignerAddress] = useState();
  const [tokens, setTokens] = useState([]);
  const [newTokenAddress, setNewTokenAddress] = useState('');
  const [selectedToken, setSelectedToken] = useState(null);

  useEffect(() => {
    async function getAddress() {
      if (props.signer) {
        const newAddress = await props.signer.getAddress();
        setSignerAddress(newAddress);
      }
    }
    getAddress();
  }, [props.signer]);

  useEffect(() => {
    async function fetchUserTokens() {
      if (props.provider && signerAddress) {
        const network = await props.provider.getNetwork();
        const chainId = network.chainId;

        const response = await fetch(`${BACKEND_URL}getUserTokens/${signerAddress}/${chainId}`);
        const userTokens = await response.json();
        setTokens(userTokens);

        // Update localStorage
        localStorage.setItem('userTokens', JSON.stringify(userTokens));

      }
    }
    fetchUserTokens();

    // Load selected token from localStorage
    const storedSelectedToken = localStorage.getItem('selectedToken');
    setSelectedToken(storedSelectedToken ? JSON.parse(storedSelectedToken) : null);
  }, [props.provider, signerAddress]);

  const selectedAddress = props.address || signerAddress;

  const [open, setOpen] = useState(false);

  const handleAddOrRemoveToken = async () => {

    const existingToken = tokens.find(token => token.address === newTokenAddress);
    if (existingToken) {
      // Remove token
      try {
        const network = await props.provider.getNetwork();
        const chainId = network.chainId;
        const response = await fetch(BACKEND_URL + "removeToken", {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            address: signerAddress,
            chainId,
            tokenAddress: newTokenAddress
          }),
        });
        const result = await response.json();
        console.log("result");
        console.log(result);
        if (result.success) {

          // Update localStorage
          localStorage.setItem('selectedToken', "");
          window.location.reload();
        }
      } catch (error) {
        console.error("Error removing token:", error);
        message.error("Network error while removing token");
      }
    } else {
      // Add token
      try {
        const tokenContract = new ethers.Contract(newTokenAddress, ERC20_ABI, props.provider);
        const tokenName = await tokenContract.name();
        const tokenSymbol = await tokenContract.symbol();

        const network = await props.provider.getNetwork();
        const chainId = network.chainId;
        console.log("TEST");
        console.log(BACKEND_URL)
        const response = await fetch(BACKEND_URL + "addToken", {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            address: signerAddress,
            chainId,
            tokenAddress: newTokenAddress,
            tokenName: `${tokenName} (${tokenSymbol})`
          }),
        });
        const result = await response.json();
        console.log("result");
        console.log(result);
        if (result.success) {
          setTokens(result.tokens);
          setNewTokenAddress('');

          // Update localStorage
          localStorage.setItem('userTokens', JSON.stringify(result.tokens));
          // window.location.reload();
        }
      } catch (error) {
        console.error("Error adding token:", error);
        message.error("Invalid token address or network error");
      }
    }
  };

  const handleSelectToken = (value) => {
    const selectedToken = value ? tokens.find(token => token.address === value) : null;
    setSelectedToken(selectedToken);
    localStorage.setItem('selectedToken', JSON.stringify(selectedToken));

    // Wait 2 seconds before reloading the page
    setTimeout(() => {
      window.location.reload();
    }, 1000); // 2000 milliseconds = 2 seconds
  };

  const providerSend = props.provider ? (
    <Tooltip title="Wallet">
      <CreditCardFilled
        onClick={() => {
          setOpen(!open);
        }}
        style={{
          padding: props.padding ? props.padding : 7,
          color: props.color ? props.color : "",
          cursor: "pointer",
          fontSize: props.size ? props.size : 28,
          verticalAlign: "middle",
        }}
      />
    </Tooltip>
  ) : (
    ""
  );

  const existingToken = tokens.find(token => token.address === newTokenAddress);

  return (
    <span>
      {providerSend}
      <Modal
        visible={open}
        title={
          <div style={{ display: "", alignItems: "center", justifyContent: "space-around", padding: '15px' }}>
            {selectedAddress ? <Address address={selectedAddress} /> : <Spin />}
            <br />
            <Balance
              address={selectedAddress}
              provider={props.provider}
              selectedToken={selectedToken}
            />
          </div>
        }
        onCancel={() => {
          setOpen(!open);
        }}
        footer={null}
      >
        <div style={{ marginBottom: '20px' }}>
          <Select
            style={{ width: '100%' }}
            value={selectedToken ? selectedToken.address : ''}
            onChange={handleSelectToken}
            placeholder="Select token"
          >
            <Option value="">Native Coin</Option>
            {tokens.map((token, index) => (
              <Option key={index} value={token.address}>{token.name}</Option>
            ))}
          </Select>
        </div>
        <div style={{ display: 'flex', marginBottom: '20px' }}>
          <Input
            value={newTokenAddress}
            onChange={(e) => setNewTokenAddress(e.target.value)}
            placeholder="Enter ERC20 token address"
            style={{ marginRight: '10px' }}
          />
          <Button onClick={handleAddOrRemoveToken}>
            {existingToken ? "Remove Token" : "Add Token"}
          </Button>
        </div>
      </Modal>
    </span>
  );
}