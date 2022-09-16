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
  const SquidBetPlayersRegistration = await deploy('SquidBetPlayersRegistration', {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: waitConfirmations,
  })

  if (!isDevChain(network.name) && process.env.ETHERSCAN_API_KEY) {
    log('Verifying...')
    await verify(SquidBetPlayersRegistration.address, args)
  }
  log('----------------------------------------------------')

  args = [SquidBetPrizePool.address, SquidBetPlayersRegistration.address];
  const SquidBetPlayersStartRound = await deploy('SquidBetPlayersStartRound', {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: waitConfirmations,
  })

  if (!isDevChain(network.name) && process.env.ETHERSCAN_API_KEY) {
    log('Verifying...')
    await verify(SquidBetPlayersStartRound.address, args)
  }
  log('----------------------------------------------------')

  args = [SquidBetPrizePool.address, SquidBetPlayersStartRound.address];
  const SquidBetPlayersSecondRound = await deploy('SquidBetPlayersSecondRound', {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: waitConfirmations,
  })

  if (!isDevChain(network.name) && process.env.ETHERSCAN_API_KEY) {
    log('Verifying...')
    await verify(SquidBetPlayersSecondRound.address, args)
  }
  log('----------------------------------------------------')

  args = [SquidBetPrizePool.address, SquidBetPlayersSecondRound.address];
  const SquidBetPlayersThridRound = await deploy('SquidBetPlayersThridRound', {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: waitConfirmations,
  })

  if (!isDevChain(network.name) && process.env.ETHERSCAN_API_KEY) {
    log('Verifying...')
    await verify(SquidBetPlayersThridRound.address, args)
  }
  log('----------------------------------------------------')

  args = [SquidBetPrizePool.address, SquidBetPlayersThridRound.address];
  const SquidBetPlayersForthRound = await deploy('SquidBetPlayersForthRound', {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: waitConfirmations,
  })

  if (!isDevChain(network.name) && process.env.ETHERSCAN_API_KEY) {
    log('Verifying...')
    await verify(SquidBetPlayersForthRound.address, args)
  }
  log('----------------------------------------------------')

  const VRFv2Consumer = ethers.getContract('VRFv2Consumer');
  args = [SquidBetPrizePool.address, SquidBetPlayersForthRound.address, VRFv2Consumer.address];
  const SquidBetPlayersFinalRound = await deploy('SquidBetPlayersFinalRound', {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: waitConfirmations,
  })

  if (!isDevChain(network.name) && process.env.ETHERSCAN_API_KEY) {
    log('Verifying...')
    await verify(SquidBetPlayersFinalRound.address, args)
  }
  log('----------------------------------------------------')
}

module.exports.tags = ['all', 'prize_pool']
