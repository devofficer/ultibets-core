const { network } = require('hardhat')

/**
 * @dev Read more at https://docs.chain.link/docs/chainlink-vrf/
 */
const BASE_FEE = '100000000000000000'
const GAS_PRICE_LINK = '1000000000' // 0.000000001 LINK per gas

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()
  const chainId = network.config.chainId
  // If we are on a local development network, we need to deploy mocks!
  if (chainId == 31337) {
    log('Local network detected! Deploying mocks...')
    const linkToken = await deploy('LinkToken', { from: deployer, log: true })
    await deploy('VRFCoordinatorV2Mock', {
      from: deployer,
      log: true,
      args: [BASE_FEE, GAS_PRICE_LINK],
    })
    await deploy('MockOracle', {
      from: deployer,
      log: true,
      args: [linkToken.address],
    })
    log('Mocks Deployed!')
    log('----------------------------------------------------')
  }
}
module.exports.tags = ['all', 'mocks', 'main']
