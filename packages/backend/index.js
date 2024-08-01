var express = require("express");
var fs = require("fs");
const https = require("https");
var cors = require("cors");
var bodyParser = require("body-parser");
var app = express();

let transactions = {};

app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", function (req, res) {
  console.log("/");
  res.status(200).send("hello world");
});

app.get("/:key", function (req, res) {
  let key = req.params.key;
  console.log("/", key);
  res.status(200).send(transactions[key]);
});

app.post("/", function (request, response) {
  console.log("POOOOST!!!!", request.body); // your JSON
  response.send(request.body); // echo the result back
  const key = request.body.address + "_" + request.body.chainId;
  console.log("key:", key);
  if (!transactions[key]) {
    transactions[key] = {};
  }
  transactions[key][request.body.txHash] = request.body;
  console.log("transactions", transactions);
});

if (fs.existsSync("server.key") && fs.existsSync("server.cert")) {
  https
    .createServer(
      {
        key: fs.readFileSync("server.key"),
        cert: fs.readFileSync("server.cert"),
      },
      app
    )
    .listen(49899, "0.0.0.0", () => {
      console.log("HTTPS Listening: 49899");
    });
} else {
  var server = app.listen(49899, "0.0.0.0", function () {
    console.log("HTTP Listening on port:", server.address().port);
  });
}

app.post("/updateStatus", function (req, res) {
  console.log("UPDATE STATUS POST!!!!", req.body); // your JSON

  const { address, chainId, txHash, status } = req.body;

  if (!address || !chainId || !txHash || !status) {
    return res.status(400).send("Missing required parameters");
  }

  const key = `${address}_${chainId}`;

  if (transactions[key] && transactions[key][txHash]) {
    transactions[key][txHash].status = status;
    console.log(`Updated status for transaction ${txHash} to ${status}`);
    res.status(200).send(`Transaction status updated to ${status}`);
  } else {
    res.status(404).send("Transaction not found");
  }
});


// Add this at the top of your backend file
let userTokens = {};

// Modify the route to handle token addition
app.post("/addToken", function (request, response) {
  const { address, chainId, tokenAddress, tokenName } = request.body;
  const key = `${address}_${chainId}`;

  if (!userTokens[key]) {
    userTokens[key] = [];
  }

  const existingToken = userTokens[key].find(token => token.address === tokenAddress);
  if (!existingToken) {
    userTokens[key].push({ address: tokenAddress, name: tokenName });
  }

  console.log("User tokens:", userTokens);
  response.status(200).send({ success: true, tokens: userTokens[key] });
});

// New removeToken route
app.post("/removeToken", function (request, response) {
  const { address, chainId, tokenAddress } = request.body;
  const key = `${address}_${chainId}`;

  if (userTokens[key]) {
    userTokens[key] = userTokens[key].filter(token => token.address !== tokenAddress);
  }

  console.log("User tokens after removal:", userTokens);
  response.status(200).send({ success: true, tokens: userTokens[key] });
});


// Modify the route to get user tokens
app.get("/getUserTokens/:address/:chainId", function (req, res) {
  const { address, chainId } = req.params;
  const key = `${address}_${chainId}`;

  res.status(200).send(userTokens[key] || []);
});


// Add this at the top of your backend file
let userWallets = {};

// Modify the route to handle token addition
app.post("/addWallet", function (request, response) {
  const { userAddress, chainId, multiSigWalletAddress, walletName } = request.body;
  const key = `${userAddress}_${chainId}`;

  if (!userWallets[key]) {
    userWallets[key] = [];
  }

  const existingWallet = userWallets[key].find(wallet => wallet.multiSigWalletAddress === multiSigWalletAddress);
  if (!existingWallet) {
    userWallets[key].push({ multiSigWalletAddress: multiSigWalletAddress, walletName: walletName });
  }

  console.log("User Wallets:", userWallets);
  response.status(200).send({ success: true, wallets: userWallets[key] });
});

// Modify the route to get user tokens
app.get("/getUserWallets/:address/:chainId", function (req, res) {
  const { address, chainId } = req.params;
  const key = `${address}_${chainId}`;

  res.status(200).send(userWallets[key] || []);
});


const userMultiSigWallets = {};

app.post("/addMultiSigWallet", function (request, response) {
  const { address, chainId, name, ownerAddress } = request.body;
  const key = `${ownerAddress}_${chainId}`;

  if (!userMultiSigWallets[key]) {
    userMultiSigWallets[key] = {};
  }

  userMultiSigWallets[key][address] = name;

  console.log("User multi-sig wallets:", userMultiSigWallets);
  response.status(200).send({ success: true });
});

app.get("/getMultiSigWallets/:address/:chainId", function (request, response) {
  const { address, chainId } = request.params;
  const key = `${address}_${chainId}`;

  const wallets = userMultiSigWallets[key] || {};
  response.status(200).send(wallets);
});