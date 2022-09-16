const { assert, expect } = require('chai')
const { network, deployments, ethers } = require('hardhat')
const { isDevChain } = require('../../utils/helpers')

!isDevChain(network.name)
  ? describe.skip
  : describe('VRFv2Consumer Unit Tests', async function () {
      let vrfConsumer, vrfCoordinatorV2Mock

      beforeEach(async () => {
        await deployments.fixture(['mocks', 'vrf'])
        vrfCoordinatorV2Mock = await ethers.getContract('VRFCoordinatorV2Mock')
        vrfConsumer = await ethers.getContract('VRFv2Consumer')
      })

      it('Should successfully request a random number', async () => {
        await expect(vrfConsumer.requestRandomWords()).to.emit(
          vrfCoordinatorV2Mock,
          'RandomWordsRequested',
        )
      })

      it('Should successfully request a random number and get a result', async () => {
        await vrfConsumer.requestRandomWords()
        const requestId = await vrfConsumer.s_requestId()

        // simulate callback from the oracle network
        await expect(
          vrfCoordinatorV2Mock.fulfillRandomWords(
            requestId,
            vrfConsumer.address,
          ),
        ).to.emit(vrfConsumer, 'ReturnedRandomness')

        const randomNumber = await vrfConsumer.s_randomWords(0)

        assert(
          randomNumber.gt(ethers.constants.Zero),
          'First random number is greather than zero',
        )
      })

      it('Should successfully fire event on callback', async function () {
        await new Promise(async (resolve, reject) => {
          vrfConsumer.once('ReturnedRandomness', async () => {
            console.log('ReturnedRandomness event fired!')
            const randomNumber = await vrfConsumer.s_randomWords(0)
            // assert throws an error if it fails, so we need to wrap
            // it in a try/catch so that the promise returns event
            // if it fails.
            try {
              assert(randomNumber.gt(ethers.constants.Zero))
              resolve()
            } catch (e) {
              reject(e)
            }
          })
          await vrfConsumer.requestRandomWords()
          const requestId = await vrfConsumer.s_requestId()
          vrfCoordinatorV2Mock.fulfillRandomWords(
            requestId,
            vrfConsumer.address,
          )
        })
      })
    })
