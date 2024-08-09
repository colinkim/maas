import React, { useState, useEffect } from "react";
import { List, Spin, Tag, Typography } from "antd";
import { Address } from "..";
const { ethers } = require("ethers");

const { Title } = Typography;

export default function Owners({
  contractAddress,
  blockExplorer,
  localProvider,
  contractName,
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [ownersData, setOwnersData] = useState(null);
  const [thresholdData, setThresholdData] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      if (!contractAddress || !localProvider) return;

      setIsLoading(true);
      setOwnersData(null);
      setThresholdData(null);

      try {
        // Import ABI dynamically
        const { multiSigWalletABI } = await import('../../contracts/multi_sig_wallet');

        // Create contract instance
        const contract = new ethers.Contract(contractAddress, multiSigWalletABI, localProvider);

        const [owners, threshold] = await Promise.all([
          contract.getOwners(),
          contract.required()
        ]);

        if (isMounted) {
          setOwnersData(owners);
          setThresholdData(threshold);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error fetching contract data:", error);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [contractAddress, localProvider]);

  if (isLoading) {
    return <Spin tip="Loading Owners..." />;
  }

  if (!ownersData || !thresholdData) {
    return <div>No data available</div>;
  }

  return (
    <div>
      <Tag style={{ width: 400, margin: "auto", padding: 5 }}>
        <Title style={{ marginTop: 8 }} level={4}>Threshold: {thresholdData.toNumber()}</Title>
      </Tag>

      <List
        header={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={4}>Owners</Title>
          </div>
        }
        style={{ maxWidth: 400, margin: "auto", marginTop: 16 }}
        bordered
        dataSource={ownersData || []}
        renderItem={(ownerAddress) => (
          <List.Item key={`owner_${ownerAddress}`}>
            <Address
              address={ownerAddress}
              blockExplorer={blockExplorer}
              fontSize={16}
            />
          </List.Item>
        )}
      />
    </div>
  );
}