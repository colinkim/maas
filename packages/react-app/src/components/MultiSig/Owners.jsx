import React, { useState, useEffect, useRef, useCallback } from "react";
import { Select, List, Spin, Collapse, Tag } from "antd";
import { Address } from "..";
import {
  useContractReader,
} from "eth-hooks";
const { Panel } = Collapse;

export default function Owners({
  contractAddress,
  // signaturesRequired,
  blockExplorer,
  readContracts,
  contractName
}) {

  const currentOwners = useContractReader(readContracts, contractName, "getOwners");
  const signaturesRequired = useContractReader(readContracts, contractName, "required");


  useEffect(() => {

    console.log("CHANGED NAME");




  }, [contractName]);


  if (!currentOwners) {
    return <Spin tip="Loading Owners..." />;
  }



  const owners = new Set();
  const prevOwners = new Set();
  currentOwners.forEach((owner) => {
    owners.add(owner);
  });

  return (
    <div>
      <Tag style={{ width: 400, margin: "auto", }}>
        <h2 style={{ paddingTop: "10px" }}>Threshold: {signaturesRequired ? signaturesRequired.toNumber() : <Spin />}</h2>
      </Tag>

      <List
        header={<h2>Owners</h2>}
        style={{ maxWidth: 400, margin: "auto", marginTop: 16 }}
        bordered
        dataSource={[...owners]}
        renderItem={(ownerAddress) => {
          return (
            <List.Item key={"owner_" + ownerAddress}>
              <Address
                address={ownerAddress}
                blockExplorer={blockExplorer}
                fontSize={16}
              />
            </List.Item>
          )
        }}
      />

      {/* <Collapse collapsible={owners.size === 0 ? "disabled" : ""} style={{ maxWidth: 400, margin: "auto", marginTop: 10, padding: "0px" }}>
        <Panel header={<span style={{ marginLeft: "0px", padding: "0px" }}><b>Previous Owners</b></span>} key="1">
          <List
            dataSource={[...owners]}
            style={{ maxWidth: 400, margin: "auto", }}
            bordered
            renderItem={(prevOwnerAddress) => {
              return (
                <List.Item key={"owner_" + prevOwnerAddress}>
                  <Address
                    address={prevOwnerAddress}
                    blockExplorer={blockExplorer}
                    fontSize={16}
                  />
                </List.Item>
              )
            }}
          />
        </Panel>
      </Collapse> */}
    </div>
  );
}