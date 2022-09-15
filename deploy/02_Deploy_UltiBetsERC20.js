const { network } = require('hardhat')
const { developmentChains } = require('../utils/config')
const { verify, getWaitBlockConfirmations } = require('../utils/helpers')

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()

  const VRFv2Consumer = await deploy('UltiBetsERC20', {
    from: deployer,
    log: true,
    waitConfirmations: getWaitBlockConfirmations(network.name),
  })

  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    log('Verifying...')
    await verify(VRFv2Consumer.address)
  }

  log('----------------------------------------------------')
}

module.exports.tags = ['all', 'vrf']
