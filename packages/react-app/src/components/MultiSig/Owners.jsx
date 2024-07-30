import React from "react";
import { Select, List, Spin, Collapse, Tag } from "antd";
import { Address } from "..";

const { Panel } = Collapse;

export default function Owners({
  ownerEvents,
  signaturesRequired,
  blockExplorer
}) {
  if (!ownerEvents) {
    return <Spin tip="Loading owner events..." />;
  }

  const owners = new Set();
  const prevOwners = new Set();
  ownerEvents.forEach((ownerEvent) => {
    if (ownerEvent.args.added) {
      owners.add(ownerEvent.args.owner);
      prevOwners.delete(ownerEvent.args.owner)
    } else {
      prevOwners.add(ownerEvent.args.owner)
      owners.delete(ownerEvent.args.owner);
    }
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

      <Collapse collapsible={prevOwners.size === 0 ? "disabled" : ""} style={{ maxWidth: 400, margin: "auto", marginTop: 10, padding: "0px" }}>
        <Panel header={<span style={{ marginLeft: "0px", padding: "0px" }}><b>Previous Owners</b></span>} key="1">
          <List
            dataSource={[...prevOwners]}
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
      </Collapse>
    </div>
  );
}