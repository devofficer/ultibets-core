const { network } = require('hardhat')
const { NETWORK_CONFIG } = require('../utils/config')
const {
  verify,
  getWaitBlockConfirmations,
  isDevChain,
} = require('../utils/helpers')

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()
  const chainId = network.config.chainId
  let vrfCoordinatorAddress
  let subscriptionId

  if (chainId == 31337) {
    VRFCoordinatorV2Mock = await ethers.getContract('VRFCoordinatorV2Mock')

    vrfCoordinatorAddress = VRFCoordinatorV2Mock.address

    const fundAmount = NETWORK_CONFIG[chainId]['fundAmount']
    const transaction = await VRFCoordinatorV2Mock.createSubscription()
    const transactionReceipt = await transaction.wait(1)
    subscriptionId = ethers.BigNumber.from(
      transactionReceipt.events[0].topics[1],
    )
    await VRFCoordinatorV2Mock.fundSubscription(subscriptionId, fundAmount)
  } else {
    subscriptionId = process.env.VRF_SUBSCRIPTION_ID
    vrfCoordinatorAddress = NETWORK_CONFIG[chainId]['vrfCoordinator']
  }
  const keyHash = NETWORK_CONFIG[chainId]['keyHash']
  const args = [subscriptionId, vrfCoordinatorAddress, keyHash]
  const VRFv2Consumer = await deploy('VRFv2Consumer', {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: getWaitBlockConfirmations(network.name),
  })

  if (!isDevChain(chainId) && process.env.ETHERSCAN_API_KEY) {
    log('Verifying...')
    await verify(VRFv2Consumer.address, args)
  }

  log('----------------------------------------------------')
}

module.exports.tags = ['all', 'vrf']
