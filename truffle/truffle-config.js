const HDWalletProvider = require("@truffle/hdwallet-provider");
require("dotenv").config();
const path = require("path");

const mnemonic = process.env.MNEMONIC;
const urlRinkeby = process.env.RPC_RINKEBY;
const urlRopsten = process.env.RPC_ROPSTEN;
const urlMainnet = process.env.RPC_MAINNET;

module.exports = {
  contracts_build_directory: path.join(__dirname, "public_static/contracts"),
  networks: {
    rinkeby: {
      provider: () => {
        return new HDWalletProvider(mnemonic, urlRinkeby);
      },
      network_id: "4",
      skipDryRun: true
    },
    ropsten: {
      provider: () => {
        return new HDWalletProvider(mnemonic, urlRopsten);
      },
      network_id: "3",
      skipDryRun: true
    },
    mainnet: {
      provider: () => {
        return new HDWalletProvider(mnemonic, urlMainnet);
      },
      network_id: "1",
      skipDryRun: true
    }
  },
  compilers: {
    solc: {
      version: "0.8.2",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      },
    }
  },
  api_keys: {
    etherscan: process.env.ETHERSCAN_API_KEY
  },
  plugins: ["truffle-plugin-verify"]
};
