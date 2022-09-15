require("@nomiclabs/hardhat-waffle");
require("hardhat-deploy");
require("dotenv").config();

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.4",
      },
      {
        version: "0.4.24",
      },
    ],
  },

  networks: {
    hardhat: {
      allowUnlimitedContractSize: true
    },
    rinkeby: {
      url: process.env.RINKEBY_RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
      saveDeployments: true,
      chainId: 4,
    },
  },

  namedAccounts: {
    deployer: {
      default: 0, // here this will by default take the first account as deployer
      1: 0, // similarly on mainnet it will take the first account as deployer. Note though that depending on how hardhat network are configured, the account 0 on one network can be different than on another
    },
    feeCollector: {
      default: 1,
    },
  },
};
