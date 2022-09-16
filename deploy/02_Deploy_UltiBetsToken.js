const { network } = require('hardhat')
const {
  verify,
  getWaitBlockConfirmations,
  isDevChain,
} = require('../utils/helpers')

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()

  const UltiBetsToken = await deploy('UltiBetsToken', {
    from: deployer,
    log: true,
    waitConfirmations: getWaitBlockConfirmations(network.name),
  })

  if (!isDevChain(network.name) && process.env.ETHERSCAN_API_KEY) {
    log('Verifying...')
    await verify(UltiBetsToken.address)
  }

  log('----------------------------------------------------')
}

module.exports.tags = ['all', 'token']
