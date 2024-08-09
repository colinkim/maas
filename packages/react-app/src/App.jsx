import { Button, Col, Menu, Row, Alert, Select } from "antd";
import "antd/dist/antd.css";
import {
  useBalance,
  useContractLoader,
  useContractReader,
  useGasPrice,
  useOnBlock,
  useUserProviderAndSigner,
} from "eth-hooks";
import { useExchangeEthPrice } from "eth-hooks/dapps/dex";
import { useEventListener } from "eth-hooks/events/";
import React, { useCallback, useEffect, useState } from "react";
import { Link, Route, Switch, useLocation, useHistory } from "react-router-dom";

import "./App.css";
import {
  Account,
  Contract,
  Faucet,
  GasGauge,
  Header,
  Ramp,
  ThemeSwitch,
  NetworkDisplay,
  FaucetHint,
  NetworkSwitch,
  CreateMultiSigModal,
  ImportMultiSigModal,
} from "./components";
import { NETWORKS, ALCHEMY_KEY } from "./constants";
import externalContracts from "./contracts/external_contracts";
import { multiSigWalletABI } from './contracts/multi_sig_wallet';// contracts
// contracts
import deployedContracts from "./contracts/hardhat_contracts.json";
import { Transactor, Web3ModalSetup } from "./helpers";
import { Home, Hints, Subgraph, CreateTransaction, Transactions, TxHistory } from "./views";
import { useStaticJsonRPC, useLocalStorage } from "./hooks";


const { Option } = Select;
const { ethers } = require("ethers");

/// 📡 What chain are your contracts deployed to?
const initialNetwork = NETWORKS.polygonAmoy; // <------- select your target frontend network (localhost, rinkeby, xdai, mainnet)

// 😬 Sorry for all the console logging
const DEBUG = false;
const NETWORKCHECK = true;
const USE_BURNER_WALLET = false; // toggle burner wallet feature
const USE_NETWORK_SELECTOR = false;
let BACKEND_URL = process.env.REACT_APP_BACKEND_SERVER;
let counter = 0;
const web3Modal = Web3ModalSetup();

function App(props) {
  const networkOptions = [initialNetwork.name];
  const history = useHistory();
  const [walletChangeCounter, setWalletChangeCounter] = useState(0);

  const [injectedProvider, setInjectedProvider] = useState();
  const [address, setAddress] = useState();
  const [selectedNetwork, setSelectedNetwork] = useState(networkOptions[0]);
  const location = useLocation();
  const [currentMultiSigName, setCurrentMultiSigName] = useState("");

  const cachedNetwork = window.localStorage.getItem("network");
  let targetNetwork = NETWORKS[cachedNetwork || "polygonAmoy"];


  if (!targetNetwork) targetNetwork = NETWORKS["polygonAmoy"];

  // 🔭 block explorer URL
  const blockExplorer = targetNetwork.blockExplorer;

  // load all your providers
  const localProvider = useStaticJsonRPC([
    process.env.REACT_APP_PROVIDER ? process.env.REACT_APP_PROVIDER : targetNetwork.rpcUrl,
  ]);
  // const mainnetProvider = useStaticJsonRPC(providers);

  if (DEBUG) console.log(`📡 Connecting to ${selectedNetwork} network`);

  const logoutOfWeb3Modal = async () => {
    await web3Modal.clearCachedProvider();
    if (injectedProvider && injectedProvider.provider && typeof injectedProvider.provider.disconnect == "function") {
      await injectedProvider.provider.disconnect();
      localStorage.setItem('currentMultiSigAddress', "");
      localStorage.setItem('currentMultiSigName', "");
      localStorage.setItem('userTokens', "");
      localStorage.setItem('selectedTokenAddress', "");
      localStorage.setItem('selectedToken', "");
    }
    setTimeout(() => {



      history.push("/");
      window.location.reload();
    }, 2);
  };



  // Use your injected provider from 🦊 Metamask or if you don't have it then instantly generate a 🔥 burner wallet.
  const userProviderAndSigner = useUserProviderAndSigner(injectedProvider, localProvider);
  const userSigner = userProviderAndSigner.signer;

  useEffect(() => {
    async function getAddress() {
      if (userSigner) {
        const newAddress = await userSigner.getAddress();
        setAddress(newAddress);
      }
    }
    getAddress();
  }, [userSigner]);

  const localChainId = localProvider && localProvider._network && localProvider._network.chainId;
  const selectedChainId =
    userSigner && userSigner.provider && userSigner.provider._network && userSigner.provider._network.chainId;



  const yourLocalBalance = useBalance(localProvider, address);

  const contractConfig = { externalContracts: externalContracts || {} };

  const readContracts = useContractLoader(localProvider, contractConfig);

  const writeContracts = useContractLoader(userSigner, contractConfig, localChainId);


  const contractName = "MultiSigWallet";
  const contractAddress = readContracts?.MultiSigWallet?.address;


  const [multiSigs, setMultiSigs] = useState([]);
  const [currentMultiSigAddress, setCurrentMultiSigAddress] = useState();



  useEffect(async () => {
    if (address) {
      const response = await fetch(`${BACKEND_URL}getUserWallets/${address}/${targetNetwork.chainId}`);
      const userWalletData = await response.json();

      // Convert to array if it's a single object
      const userWalletList = Array.isArray(userWalletData) ? userWalletData : [userWalletData];

      if (userWalletList.length > 0) {
        const savedWallet = localStorage.getItem('currentMultiSigAddress');

        if (savedWallet) {
          setCurrentMultiSigAddress(savedWallet);
          const savedWalletName = localStorage.getItem('currentMultiSigName');
          setCurrentMultiSigName(savedWalletName);


        } else {
          const recentMultiSig = userWalletList[userWalletList.length - 1];
          setCurrentMultiSigAddress(recentMultiSig.address);
          setCurrentMultiSigName(recentMultiSig.name);

        }


      }

      console.log("\n\n\n");
      console.log("List of User Wallets");
      console.log(userWalletList);

      setMultiSigs(userWalletList);


      // console.log(userWalletList.json())
      // if (userWalletList.length > 0) {
      //   const recentMultiSigAddress = userWalletList[userWalletList.length - 1];

      //   const savedAddress = localStorage.getItem('currentMultiSigAddress');
      //   if (savedAddress) {
      //     setCurrentMultiSigAddress(savedAddress);
      //     const currentWalletName = customNames[savedAddress];
      //     setCurrentMultiSigName(currentWalletName);


      //   } else {
      //     setCurrentMultiSigAddress(recentMultiSigAddress);
      //     const currentWalletName = customNames[recentMultiSigAddress];
      //     setCurrentMultiSigName(currentWalletName);

      //   }

      // }

      // if (importedMultiSigs && importedMultiSigs[targetNetwork.name]) {
      //   multiSigsForUser = [...new Set([...importedMultiSigs[targetNetwork.name], ...multiSigsForUser])];
      // }

      // if (multiSigsForUser.length > 0) {
      //   const recentMultiSigAddress = multiSigsForUser[multiSigsForUser.length - 1];
      //   if (recentMultiSigAddress !== currentMultiSigAddress) setContractNameForEvent(null);

      //   const response = await fetch(`${BACKEND_URL}getUserWallets/${address}/${targetNetwork.chainId}`);
      //   const customNames = await response.json();

      //   customNames.forEach((item, index) => {
      //     console.log(`Item ${index + 1}:`, item);
      //   });

      //   console.log("CUSTOM NAMES")
      //   console.log(customNames)
      //   console.log(multiSigsForUser)

      //   // Combine existing multiSigs with custom names
      //   const combinedMultiSigs = multiSigsForUser.map(address => ({
      //     address,
      //     name: customNames[address] || address,
      //   }));

      //   const savedAddress = localStorage.getItem('currentMultiSigAddress');
      //   if (savedAddress) {
      //     setCurrentMultiSigAddress(savedAddress);
      //     const currentWalletName = customNames[savedAddress];
      //     setCurrentMultiSigName(currentWalletName);


      //   }
      //   else {
      //     setCurrentMultiSigAddress(recentMultiSigAddress);
      //     const currentWalletName = customNames[recentMultiSigAddress];
      //     setCurrentMultiSigName(currentWalletName);

      //   }
      //   console.log(combinedMultiSigs)
      //   setMultiSigs(combinedMultiSigs);
      // }
    }
  }, [address]);



  const [contractNameForEvent, setContractNameForEvent] = useState();



  useEffect(() => {


    if (currentMultiSigAddress) {
      readContracts.MultiSigWallet = new ethers.Contract(currentMultiSigAddress, multiSigWalletABI, localProvider);
      writeContracts.MultiSigWallet = new ethers.Contract(currentMultiSigAddress, multiSigWalletABI, userSigner);

      setContractNameForEvent("MultiSigWallet");
    }
  }, [currentMultiSigAddress, readContracts, writeContracts]);




  const loadWeb3Modal = useCallback(async () => {
    try {
      const provider = await web3Modal.connect();
      setInjectedProvider(new ethers.providers.Web3Provider(provider));

      provider.on("chainChanged", chainId => {
        console.log(`chain changed to ${chainId}! updating providers`);
        setInjectedProvider(new ethers.providers.Web3Provider(provider));
      });

      provider.on("accountsChanged", () => {
        console.log(`account changed!`);
        localStorage.setItem('currentMultiSigAddress', "");
        localStorage.setItem('currentMultiSigName', "");
        localStorage.setItem('userTokens', "");
        localStorage.setItem('selectedTokenAddress', "");
        localStorage.setItem('selectedToken', "");


        history.push("/");
        window.location.reload();
        setInjectedProvider(new ethers.providers.Web3Provider(provider));
      });

      provider.on("disconnect", (code, reason) => {
        console.log("Disconnected:", code, reason);
        logoutOfWeb3Modal();
      });
    } catch (error) {
      console.error("Failed to load web3 modal:", error);
    }
  }, [setInjectedProvider]);

  useEffect(() => {
    if (web3Modal.cachedProvider) {
      loadWeb3Modal();
    }
  }, []);

  useEffect(() => {
    async function initializeContracts() {
      if (localProvider && userSigner) {
        try {
          readContracts.MultiSigWallet = new ethers.Contract(currentMultiSigAddress, multiSigWalletABI, localProvider);
          writeContracts.MultiSigWallet = new ethers.Contract(currentMultiSigAddress, multiSigWalletABI, userSigner);

          setContractNameForEvent("MultiSigWallet");
        } catch (error) {
          console.error("Error initializing contracts:", error);
        }
      }
    }

    initializeContracts();
  }, [currentMultiSigAddress, localProvider, userSigner, readContracts, writeContracts]);



  // useEffect(() => {
  //   async function initializeContracts() {
  //     if (localProvider && userSigner) {
  //       const currentWallet = multiSigs.find(wallet => wallet.address === currentMultiSigAddress);

  //       setCurrentMultiSigName(currentWallet.name);
  //     }
  //   }

  //   initializeContracts();
  // }, [currentMultiSigAddress]);

  const faucetAvailable = localProvider && localProvider.connection && targetNetwork.name.indexOf("local") !== -1;

  const userHasMultiSigs = currentMultiSigAddress ? true : false;

  const handleMultiSigChange = (value, option) => {
    setContractNameForEvent(null);
    localStorage.setItem('currentMultiSigAddress', value);
    localStorage.setItem('currentMultiSigName', option.name);
    setCurrentMultiSigName(option.name);
    setCurrentMultiSigAddress(value);
    setWalletChangeCounter(prev => prev + 1); // Increment the counter
    console.log("handleMultiSigChange")

    console.log(value)
    if (value) {
      try {
        readContracts.MultiSigWallet = new ethers.Contract(value, multiSigWalletABI, localProvider);
        writeContracts.MultiSigWallet = new ethers.Contract(value, multiSigWalletABI, userSigner);

        setContractNameForEvent("MultiSigWallet");
      } catch (error) {
        console.error("Error initializing contracts:", error);
      }
    }


  };

  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  if (DEBUG) console.log("COUNTER", counter);
  counter = counter + 1

  const selectNetworkOptions = [];
  for (const id in NETWORKS) {
    selectNetworkOptions.push(
      <Select.Option key={id} value={NETWORKS[id].name}>
        <span style={{ color: NETWORKS[id].color }}>{NETWORKS[id].name}</span>
      </Select.Option>,
    );
  }

  const networkSelect = (
    <Select
      defaultValue={targetNetwork.name}
      style={{ textAlign: "left", width: 170 }}
      onChange={value => {
        if (targetNetwork.chainId != NETWORKS[value].chainId) {
          window.localStorage.setItem("network", value);
          setTimeout(() => {
            localStorage.setItem('currentMultiSigAddress', "");
            localStorage.setItem('currentMultiSigName', "");
            localStorage.setItem('userTokens', "");
            localStorage.setItem('selectedTokenAddress', "");
            localStorage.setItem('selectedToken', "");

            history.push("/");
            window.location.reload();
          }, 1);
        }
      }}
    >
      {selectNetworkOptions}
    </Select>
  );

  return (
    <div className="App">
      <Header>
        {/* 👨‍💼 Your account is in the top right with a wallet at connect options */}
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", flex: 1, alignItems: "center", padding: "0.5rem 0" }}>
            {USE_NETWORK_SELECTOR && (
              <div style={{ marginRight: 20 }}>
                <NetworkSwitch
                  networkOptions={networkOptions}
                  selectedNetwork={selectedNetwork}
                  setSelectedNetwork={setSelectedNetwork}
                />
              </div>
            )}
            <Account
              useBurner={USE_BURNER_WALLET}
              address={address}
              localProvider={localProvider}
              userSigner={userSigner}
              // mainnetProvider={mainnetProvider}
              // price={price}
              web3Modal={web3Modal}
              loadWeb3Modal={loadWeb3Modal}
              logoutOfWeb3Modal={logoutOfWeb3Modal}
              blockExplorer={blockExplorer}
            />
          </div>
          {yourLocalBalance.lte(ethers.BigNumber.from("0")) && (
            <FaucetHint localProvider={localProvider} targetNetwork={targetNetwork} address={address} />
          )}
        </div>
      </Header>
      <NetworkDisplay
        NETWORKCHECK={NETWORKCHECK}
        localChainId={localChainId}
        selectedChainId={selectedChainId}
        targetNetwork={targetNetwork}
        logoutOfWeb3Modal={logoutOfWeb3Modal}
        USE_NETWORK_SELECTOR={USE_NETWORK_SELECTOR}
      />
      <div style={{ position: "relative" }}>
        <div style={{ position: "absolute", left: 20, display: "flex", flexDirection: "column", alignItems: "start" }}>
          <div>
            <CreateMultiSigModal
              // price={price}
              selectedChainId={selectedChainId}
              // mainnetProvider={mainnetProvider}
              address={address}
              localProvider={localProvider}
              userSigner={userSigner}
              writeContracts={writeContracts}
              contractName={"MultiSigFactory"}
              isCreateModalVisible={isCreateModalVisible}
              setIsCreateModalVisible={setIsCreateModalVisible}
              multiSigs={multiSigs}
              setMultiSigs={setMultiSigs}
              setCurrentMultiSigAddress={setCurrentMultiSigAddress}
              targetNetwork={targetNetwork}

            />
            <ImportMultiSigModal
              // mainnetProvider={mainnetProvider}
              selectedChainId={selectedChainId}
              ownerAddress={address}
              targetNetwork={targetNetwork}
              networkOptions={selectNetworkOptions}
              multiSigs={multiSigs}
              setMultiSigs={setMultiSigs}
              setCurrentMultiSigAddress={setCurrentMultiSigAddress}
              multiSigWalletABI={multiSigWalletABI}
              localProvider={localProvider}
            />
            <Select
              value={currentMultiSigAddress}
              style={{ width: 120, marginRight: 5 }}
              onChange={(value, option) => handleMultiSigChange(value, option)}
            >
              {multiSigs.map((wallet, index) => (
                <Option key={index} value={wallet.address} name={wallet.name}>
                  {wallet.name}
                </Option>
              ))}
            </Select>
            {networkSelect}
          </div>

        </div>
      </div>
      <Menu
        disabled={!userHasMultiSigs}
        style={{ textAlign: "center", marginTop: 40, fontSize: 20 }}
        selectedKeys={[location.pathname]}
        mode="horizontal"
      >
        <Menu.Item key="/">
          <Link to="/">Wallet</Link>
        </Menu.Item>
        <Menu.Item key="/transactions">
          <Link to="/transactions">Transactions</Link>
        </Menu.Item>
        <Menu.Item key="/pending">
          <Link to="/pending">Pending</Link>
        </Menu.Item>
        <Menu.Item key="/history">
          <Link to="/history">History</Link>
        </Menu.Item>
      </Menu>

      <Switch>
        <Route exact path="/">
          {!userHasMultiSigs ? (
            <Row style={{ marginTop: 40 }}>
              <Col span={12} offset={6}>
                <Alert
                  message={
                    <>
                      ✨{" "}
                      <Button onClick={() => setIsCreateModalVisible(true)} type="link" style={{ padding: 0 }}>
                        Create
                      </Button>{" "}
                      or select your Multi-Sig ✨
                    </>
                  }
                  type="info"
                />
              </Col>
            </Row>
          ) : (
            <Home
              key={walletChangeCounter}
              contractAddress={currentMultiSigAddress}
              walletName={currentMultiSigName}
              localProvider={localProvider}
              blockExplorer={blockExplorer}
              contractName={contractName}
              readContracts={readContracts}
              writeContracts={writeContracts}
              userSigner={userSigner}
            />
          )}
        </Route>
        <Route path="/transactions">
          <CreateTransaction
            key={walletChangeCounter}

            currentMultiSigName={currentMultiSigName}
            poolServerUrl={BACKEND_URL}
            contractName={contractName}
            contractAddress={contractAddress}
            // mainnetProvider={mainnetProvider}
            localProvider={localProvider}
            readContracts={readContracts}
            userSigner={userSigner}
            DEBUG={DEBUG}
            writeContracts={writeContracts}
            blockExplorer={blockExplorer}


          />
        </Route>
        <Route path="/pending">
          <Transactions
            key={walletChangeCounter}

            poolServerUrl={BACKEND_URL}
            contractName={contractName}
            address={address}
            userSigner={userSigner}
            // mainnetProvider={mainnetProvider}
            localProvider={localProvider}
            yourLocalBalance={yourLocalBalance}
            writeContracts={writeContracts}
            readContracts={readContracts}
            blockExplorer={blockExplorer}
          />
        </Route>
        <Route path="/history">
          <TxHistory
            key={walletChangeCounter}

            poolServerUrl={BACKEND_URL}
            contractName={contractName}
            address={address}
            userSigner={userSigner}
            // mainnetProvider={mainnetProvider}
            localProvider={localProvider}
            yourLocalBalance={yourLocalBalance}
            writeContracts={writeContracts}
            readContracts={readContracts}
            blockExplorer={blockExplorer}

          />
        </Route>
        <Route exact path="/debug">
          <Contract
            name={"MultiSigFactory"}
            // price={price}
            signer={userSigner}
            provider={localProvider}
            address={address}
            blockExplorer={blockExplorer}
            contractConfig={contractConfig}
          />
        </Route>
        <Route path="/hints">
          <Hints
            address={address}
            yourLocalBalance={yourLocalBalance}
          // mainnetProvider={mainnetProvider}
          // price={price}
          />
        </Route>
        {/* <Route path="/mainnetdai"> */}
        {/* <Contract
            name="DAI"
            customContract={mainnetContracts && mainnetContracts.contracts && mainnetContracts.contracts.DAI}
            signer={userSigner}
            // provider={mainnetProvider}
            address={address}
            blockExplorer="https://etherscan.io/"
            contractConfig={contractConfig}
            chainId={1}
          /> */}
        {/*
            <Contract
              name="UNI"
              customContract={mainnetContracts && mainnetContracts.contracts && mainnetContracts.contracts.UNI}
              signer={userSigner}
              provider={mainnetProvider}
              address={address}
              blockExplorer="https://etherscan.io/"
            />
            */}
        {/* </Route> */}
        {/* <Route path="/subgraph">
          <Subgraph
            subgraphUri={props.subgraphUri}
            tx={tx}
            writeContracts={writeContracts}
          // mainnetProvider={mainnetProvider}
          />
        </Route> */}
      </Switch>

      <ThemeSwitch />

      {/* 🗺 Extra UI like gas price, eth price, faucet, and support: */}
      <div style={{ position: "fixed", textAlign: "left", left: 0, bottom: 20, padding: 10 }}>
        {/* <Row align="middle" gutter={[4, 4]}>
          <Col span={8}>
            <Ramp price={price} address={address} networks={NETWORKS} />
          </Col>

          <Col span={8} style={{ textAlign: "center", opacity: 0.8 }}>
            <GasGauge gasPrice={gasPrice} />
          </Col>
          <Col span={8} style={{ textAlign: "center", opacity: 1 }}>
            <Button
              onClick={() => {
                window.open("https://t.me/joinchat/KByvmRe5wkR-8F_zz6AjpA");
              }}
              size="large"
              shape="round"
            >
              <span style={{ marginRight: 8 }} role="img" aria-label="support">
                💬
              </span>
              Support
            </Button>
          </Col>
        </Row> */}


      </div>
    </div>
  );
}

export default App;