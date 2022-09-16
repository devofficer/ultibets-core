const { network, ethers } = require('hardhat')
const {
  verify,
  getWaitBlockConfirmations,
  isDevChain,
} = require('../utils/helpers')

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()
  const waitConfirmations = getWaitBlockConfirmations(network.name)

  const UltiBetsTreasury = await ethers.getContract('UltiBetsTreasury');
  let args = [UltiBetsTreasury.address];
  const SquidBetPrizePool = await deploy('SquidBetPrizePool', {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: waitConfirmations,
  })

  if (!isDevChain(network.name) && process.env.ETHERSCAN_API_KEY) {
    log('Verifying...')
    await verify(SquidBetPrizePool.address, args)
  }
  log('----------------------------------------------------')

  args = [UltiBetsTreasury.address, SquidBetPrizePool.address];
  const SquidBetRegistration = await deploy('SquidBetRegistration', {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: waitConfirmations,
  })

  if (!isDevChain(network.name) && process.env.ETHERSCAN_API_KEY) {
    log('Verifying...')
    await verify(SquidBetRegistration.address, args)
  }
  log('----------------------------------------------------')

  args = [SquidBetPrizePool.address, SquidBetRegistration.address];
  const SquidBetStartRound = await deploy('SquidBetStartRound', {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: waitConfirmations,
  })

  if (!isDevChain(network.name) && process.env.ETHERSCAN_API_KEY) {
    log('Verifying...')
    await verify(SquidBetStartRound.address, args)
  }
  log('----------------------------------------------------')

  args = [SquidBetPrizePool.address, SquidBetStartRound.address];
  const SquidBetSecondRound = await deploy('SquidBetSecondRound', {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: waitConfirmations,
  })

  if (!isDevChain(network.name) && process.env.ETHERSCAN_API_KEY) {
    log('Verifying...')
    await verify(SquidBetSecondRound.address, args)
  }
  log('----------------------------------------------------')

  args = [SquidBetPrizePool.address, SquidBetSecondRound.address];
  const SquidBetThirdRound = await deploy('SquidBetThirdRound', {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: waitConfirmations,
  })

  if (!isDevChain(network.name) && process.env.ETHERSCAN_API_KEY) {
    log('Verifying...')
    await verify(SquidBetThirdRound.address, args)
  }
  log('----------------------------------------------------')

  args = [SquidBetPrizePool.address, SquidBetThirdRound.address];
  const SquidBetForthRound = await deploy('SquidBetForthRound', {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: waitConfirmations,
  })

  if (!isDevChain(network.name) && process.env.ETHERSCAN_API_KEY) {
    log('Verifying...')
    await verify(SquidBetForthRound.address, args)
  }
  log('----------------------------------------------------')

  const VRFv2Consumer = await ethers.getContract('VRFv2Consumer');
  args = [SquidBetPrizePool.address, SquidBetForthRound.address, VRFv2Consumer.address];
  const SquidBetFinalRound = await deploy('SquidBetFinalRound', {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: waitConfirmations,
  })

  if (!isDevChain(network.name) && process.env.ETHERSCAN_API_KEY) {
    log('Verifying...')
    await verify(SquidBetFinalRound.address, args)
  }
  log('----------------------------------------------------')
}

module.exports.tags = ['all', 'squid_bet']
