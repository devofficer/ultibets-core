// we can't have these functions in our `helper-hardhat-config`
// since these use the hardhat library
// and it would be a circular dependency
const { run, network } = require('hardhat')
const {
  NETWORK_CONFIG,
  VERIFICATION_BLOCK_CONFIRMATIONS,
  DEV_CHAINS,
} = require('./config')

const autoFundCheck = async (
  contractAddr,
  networkName,
  linkTokenAddress,
  additionalMessage,
) => {
  const chainId = network.config.chainId
  console.log('Checking to see if contract can be auto-funded with LINK:')
  const amount = NETWORK_CONFIG[chainId]['fundAmount']
  //check to see if user has enough LINK
  const accounts = await ethers.getSigners()
  const signer = accounts[0]
  const LinkToken = await ethers.getContractFactory('LinkToken')
  const linkTokenContract = new ethers.Contract(
    linkTokenAddress,
    LinkToken.interface,
    signer,
  )
  const balanceBN = await linkTokenContract.balanceOf(signer.address)
  const balance = balanceBN.toString()
  const contractBalanceBN = await linkTokenContract.balanceOf(contractAddr)
  const contractBalance = await contractBalanceBN.toString()
  if (balance > amount && amount > 0 && contractBalance < amount) {
    //user has enough LINK to auto-fund
    //and the contract isn't already funded
    return true
  } else {
    //user doesn't have enough LINK, print a warning
    console.log(
      "Account doesn't have enough LINK to fund contracts, you're deploying to a network where auto funding isnt' done by default, the contract is already funded, or you set AUTO_FUND to false.",
    )
    console.log(
      `Please obtain LINK via the faucet at https://faucets.chain.link/${networkName} then run the following command to fund contract with LINK:`,
    )
    console.log(
      `yarn hardhat fund-link --contract ${contractAddr} --network ${networkName} ${additionalMessage}`,
    )
    return false
  }
}

const verify = async (contractAddress, args) => {
  console.log('Verifying contract...')
  try {
    await run('verify:verify', {
      address: contractAddress,
      constructorArguments: args,
    })
  } catch (e) {
    if (e.message.toLowerCase().includes('already verified')) {
      console.log('Already verified!')
    } else {
      console.log(e)
    }
  }
}

const getRevertMessage = (reason) => {
  return `VM Exception while processing transaction: reverted with reason string '${reason}'`
}

const isDevChain = (chain) => {
  if (typeof chain === 'number') {
    return chain === 31337
  } else {
    return DEV_CHAINS.includes(chain)
  }
}

const getWaitBlockConfirmations = (chain) => {
  return isDevChain(chain) ? 1 : VERIFICATION_BLOCK_CONFIRMATIONS
}

module.exports = {
  autoFundCheck,
  verify,
  getRevertMessage,
  getWaitBlockConfirmations,
  isDevChain,
}
