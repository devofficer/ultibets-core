const { network, ethers } = require('hardhat')
const { developmentChains, networkConfig } = require('../utils/config')
const { verify, getWaitBlockConfirmations, isDevChain } = require('../utils/helpers')

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()
  const chainId = network.config.chainId
  let fundToken

  if (isDevChain(chainId)) {
    const MockToken = await ethers.getContract('MockToken');
    fundToken = MockToken.address;
  } else {
    fundToken = networkConfig[chainId].fundToken;
  }

  const args = [[deployer.address], 1, fundToken]

  const UltiBetsTreasury = await deploy('UltiBetsTreasury', {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: getWaitBlockConfirmations(network.name),
  })

  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    log('Verifying...')
    await verify(UltiBetsTreasury.address, args)
  }

  log('----------------------------------------------------')
}

module.exports.tags = ['all', 'treasury']
