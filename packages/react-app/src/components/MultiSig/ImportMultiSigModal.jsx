import React, { useState } from "react";
import { Button, Modal, Select, Alert } from "antd";
import { ethers } from "ethers";
import { useLocalStorage } from "../../hooks";
import { Input } from "antd";

import { AddressInput } from "..";

export default function ImportMultiSigModal({
  ownerAddress,
  mainnetProvider,
  targetNetwork,
  networkOptions,
  multiSigs,
  setMultiSigs,
  setCurrentMultiSigAddress,
  multiSigWalletABI,
  localProvider,
  selectedChainId
}) {
  const [importedMultiSigs, setImportedMultiSigs] = useLocalStorage("importedMultiSigs");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [pendingImport, setPendingImport] = useState(false);
  const [error, setError] = useState(false);
  const [address, setAddress] = useState();
  const [network, setNetwork] = useState(targetNetwork.name);
  const [walletName, setWalletName] = useState([""]);

  const resetState = () => {
    setError(false);
    setAddress("");
    setNetwork(targetNetwork.name);
    setPendingImport(false);
  };
  let BACKEND_URL = process.env.REACT_APP_BACKEND_SERVER;

  const handleCancel = () => {
    resetState();
    setIsModalVisible(false);
  };

  const handleSubmit = async () => {
    try {
      setPendingImport(true);

      const contract = new ethers.Contract(address, multiSigWalletABI, localProvider);
      const owners = await contract.getOwners();
      const isOwner = owners.includes(ownerAddress);

      if (!isOwner) {
        setError(true);
        setPendingImport(false);
      }

      const response = await fetch(`${BACKEND_URL}addWallet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          multiSigWalletAddress: address, // Using receipt.contractAddress instead of result.contractAddress
          chainId: selectedChainId,
          walletName: walletName,
          userAddress: ownerAddress,

        }),
      });

      const result = await response.json();
      if (result.success) {
        // Store in localStorage

        let newImportedMultiSigs = importedMultiSigs || {};
        (newImportedMultiSigs[network] = newImportedMultiSigs[network] || []).push(address);
        newImportedMultiSigs[network] = [...new Set(newImportedMultiSigs[network])];
        setImportedMultiSigs(newImportedMultiSigs);

        if (network === targetNetwork.name) {
          setMultiSigs([...new Set([...newImportedMultiSigs[network], ...multiSigs])]);
          setCurrentMultiSigAddress(address);
        }

        resetState();
        setIsModalVisible(false);
        setTimeout(() => {
          window.location.reload();
        }, 2500);

      }
    } catch (e) {
      console.error("IMPORT MULTI-SIG FAILED: ", e);
      setError(true);
      setPendingImport(false);
    }
  };

  return (
    <>
      <Button type="primary" style={{ marginRight: 10 }} onClick={() => setIsModalVisible(true)}>Import</Button>
      <Modal
        title="Import Multisig"
        visible={isModalVisible}
        onCancel={handleCancel}
        destroyOnClose
        footer={[
          <Button key="back" onClick={handleCancel}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            disabled={!address || !network}
            loading={pendingImport}
            onClick={handleSubmit}
          >
            Import
          </Button>,
        ]}
      >


        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

          <Input
            placeholder="Wallet Name"
            value={walletName}
            onChange={(e) => setWalletName(e.target.value)}
          />

          <AddressInput
            autoFocus
            ensProvider={mainnetProvider}
            placeholder={"MultiSig Wallet Address"}
            value={address}
            onChange={setAddress}
          />
          <Select
            defaultValue={targetNetwork.name}
            onChange={value => setNetwork(value)}
          >
            {networkOptions}
          </Select>
          {error && <Alert message="Unable to import: Please only import Multi.Sig.Wallets that you own." type="error" showIcon />}
        </div>
      </Modal>
    </>
  );
}
