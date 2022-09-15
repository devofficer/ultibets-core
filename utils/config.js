const networkConfig = {
  default: {
    name: "hardhat",
    fee: "100000000000000000",
    keyHash: "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc",
    fundAmount: "1000000000000000000",
  },
  31337: {
    name: "localhost",
    fee: "100000000000000000",
    keyHash: "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc",
    fundAmount: "1000000000000000000",
  },
  4: {
    name: "rinkeby",
    linkToken: "0x01be23585060835e02b77ef475b0cc51aa1e0709",
    keyHash: "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc",
    vrfCoordinator: "0x6168499c0cFfCaCD319c818142124B7A15E857ab",
    oracle: "0xc57b33452b4f7bb189bb5afae9cc4aba1f7a4fd8",
    fee: "100000000000000000",
    fundAmount: "100000000000000000", // 0.1
  },
  137: {
    name: "polygon",
    linkToken: "0xb0897686c545045afc77cf20ec7a532e3120e0f1",
    keyHash: "0x6e099d640cde6de9d40ac749b4b594126b0169747122711109c9985d47751f93",
    vrfCoordinator: "0xAE975071Be8F8eE67addBC1A82488F1C24858067",
    oracle: "0x0a31078cd57d23bf9e8e8f1ba78356ca2090569e",
    fee: "100000000000000",
    fundAmount: "100000000000000",
  },
}

const developmentChains = ["hardhat", "localhost"]
const VERIFICATION_BLOCK_CONFIRMATIONS = 6

/**
 * @dev Read more at https://docs.chain.link/docs/chainlink-vrf/
 */
 const BASE_FEE = '100000000000000000'
 const GAS_PRICE_LINK = '1000000000' // 0.000000001 LINK per gas

module.exports = {
  networkConfig,
  developmentChains,
  VERIFICATION_BLOCK_CONFIRMATIONS,
  BASE_FEE,
  GAS_PRICE_LINK
}
