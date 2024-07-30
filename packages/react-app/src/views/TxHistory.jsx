import React from "react";
import { List } from "antd";
import { TransactionListItem }from "../components";

export default function TxHistory({
  contractName,
  mainnetProvider,
  price,
  readContracts,
  executeTransactionEvents,
  blockExplorer,
}) {

  return (
    <div>
      <div style={{ padding: 32, maxWidth: 850, margin: "auto" }}>
      <h1>
        <b style={{ padding: 16 }}>Transaction History</b>
      </h1>

      <List
          bordered
          dataSource={executeTransactionEvents}
          renderItem={item => {
            return (
              <TransactionListItem
                item={Object.create(item)}
                mainnetProvider={mainnetProvider}
                blockExplorer={blockExplorer}
                price={price}
                readContracts={readContracts}
                contractName={contractName}
              />
            );
          }}
        />
        </div>
    </div>
  );
}
