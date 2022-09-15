const { network } = require("hardhat")
const {
  networkConfig,
  developmentChains,
  VERIFICATION_BLOCK_CONFIRMATIONS,
} = require("../utils/config")
const { verify } = require("../utils/helper-functions")

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()
  const chainId = network.config.chainId
  let vrfCoordinatorAddress
  let subscriptionId

  if (chainId == 31337) {
    VRFCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")

    vrfCoordinatorAddress = VRFCoordinatorV2Mock.address

    const fundAmount = networkConfig[chainId]["fundAmount"]
    const transaction = await VRFCoordinatorV2Mock.createSubscription()
    const transactionReceipt = await transaction.wait(1)
    subscriptionId = ethers.BigNumber.from(transactionReceipt.events[0].topics[1])
    await VRFCoordinatorV2Mock.fundSubscription(subscriptionId, fundAmount)
  } else {
    subscriptionId = process.env.VRF_SUBSCRIPTION_ID
    vrfCoordinatorAddress = networkConfig[chainId]["vrfCoordinator"]
  }
  const keyHash = networkConfig[chainId]["keyHash"]
  const waitBlockConfirmations = developmentChains.includes(network.name)
    ? 1
    : VERIFICATION_BLOCK_CONFIRMATIONS
  const args = [subscriptionId, vrfCoordinatorAddress, keyHash]
  const VRFv2Consumer = await deploy("VRFv2Consumer", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: waitBlockConfirmations,
  })

  if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
    log("Verifying...")
    await verify(VRFv2Consumer.address, args)
  }

  log("----------------------------------------------------")
}

module.exports.tags = ["all", "vrf"]
