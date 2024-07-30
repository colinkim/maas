import React from "react";
import { Balance, Address, TransactionListItem, Owners } from "../components";
import QR from "qrcode.react";
import { List, Button, Flex, Tag } from "antd";

export default function Home({
  contractAddress,
  localProvider,
  price,
  blockExplorer,
  executeTransactionEvents,
  contractName,
  readContracts,
  ownerEvents,
  signaturesRequired,
}) {
  return (
    <>
      <div style={{ padding: 16, maxWidth: 850, margin: "auto" }}>
        <div style={{ paddingBottom: 32 }}>
          <div>
            <Balance
              address={contractAddress ? contractAddress : ""}
              provider={localProvider}
              dollarMultiplier={price}
              size={48}
            />
          </div>
          <div>
            <QR
              value={contractAddress ? contractAddress.toString() : ""}
              size="180"
              level="H"
              includeMargin
              renderAs="svg"
              imageSettings={{ excavate: false }}
            />
          </div>

          <Tag style={{ padding: '10px', width: 400 }}>

            <div style={{ display: "flex", justifyContent: "center" }}>

              <Address style={{ padding: '30px' }}
                address={contractAddress ? contractAddress : ""}

                blockExplorer={blockExplorer}
                fontSize={24}
              />



            </div>

          </Tag>

        </div>
        <div style={{ padding: 16 }}>
          <Owners ownerEvents={ownerEvents} signaturesRequired={signaturesRequired} blockExplorer={blockExplorer} />
        </div>
        {/* <div style={{padding:64}}>
        <Button type={"primary"} onClick={()=>{
          window.location = "/transactions"
        }}>Propose Transaction</Button>
        </div> */}


      </div>


    </>
  );
}
