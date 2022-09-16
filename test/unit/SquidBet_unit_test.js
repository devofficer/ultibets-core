const { expect } = require('chai')
const { deployments, ethers } = require('hardhat')

describe('SquidBet Contracts', function () {
  let vrfConsumer,
    oracle,
    squidBetRegistration,
    squidBetStartRound,
    squidBetSecondRound,
    squidBetThirdRound,
    squidBetForthRound,
    squidBetFinalRound
  let owner, addr1, addr2, addr3, addr4, addr5, addr6

  beforeEach(async function () {
    await deployments.fixture(['mocks', 'vrf', 'squid_bet'])
    ;[
      owner,
      addr1,
      addr2,
      addr3,
      addr4,
      addr5,
      addr6,
    ] = await ethers.getSigners()
    oracle = await ethers.getContract('MockOracle')
    vrfConsumer = await ethers.getContract('VRFv2Consumer')
    squidBetRegistration = await ethers.getContract('SquidBetRegistration')
    squidBetStartRound = await ethers.getContract('SquidBetStartRound')
    squidBetSecondRound = await ethers.getContract('SquidBetSecondRound')
    squidBetThirdRound = await ethers.getContract('SquidBetThirdRound')
    squidBetForthRound = await ethers.getContract('SquidBetForthRound')
    squidBetFinalRound = await ethers.getContract('SquidBetFinalRound')

    await squidBetRegistration.addOracle(oracle.address)
    await squidBetStartRound.addOracle(oracle.address)
    await squidBetSecondRound.addOracle(oracle.address)
    await squidBetThirdRound.addOracle(oracle.address)
    await squidBetForthRound.addOracle(oracle.address)
    await squidBetFinalRound.addOracle(oracle.address)
  })

  it('does basic checks', async function () {
    const regTxParams = { value: ethers.utils.parseEther('1.0') }
    await squidBetRegistration.connect(addr1).registerPlayer(regTxParams)
    await squidBetRegistration.connect(addr2).registerPlayer(regTxParams)
    await squidBetRegistration.connect(addr3).registerPlayer(regTxParams)
    await squidBetRegistration.connect(addr4).registerPlayer(regTxParams)
    await squidBetRegistration.connect(addr5).registerPlayer(regTxParams)

    expect(await squidBetRegistration.totalPlayerNumber()).to.equal('5')
    expect(await squidBetRegistration.getRegisterPlayerCount()).to.equal('5')
    expect(await squidBetRegistration.getBalance()).to.equal(
      ethers.utils.parseEther('4.5'),
    )
    expect(
      await squidBetRegistration.getIsRegisteredPlayer(addr1.address),
    ).to.equal(true)
    expect(
      await squidBetRegistration.getIsRegisteredPlayer(addr2.address),
    ).to.equal(true)
    expect(
      await squidBetRegistration.getIsRegisteredPlayer(addr3.address),
    ).to.equal(true)
    expect(
      await squidBetRegistration.getIsRegisteredPlayer(addr4.address),
    ).to.equal(true)
    expect(
      await squidBetRegistration.getIsRegisteredPlayer(addr5.address),
    ).to.equal(true)
  })

  it('check if registered players are inherited across contract', async function () {
    const regTxParams = { value: ethers.utils.parseEther('1.0') }
    await squidBetRegistration.connect(addr1).registerPlayer(regTxParams)
    await squidBetRegistration.connect(addr2).registerPlayer(regTxParams)
    await squidBetRegistration.connect(addr3).registerPlayer(regTxParams)
    await squidBetRegistration.connect(addr4).registerPlayer(regTxParams)
    await squidBetRegistration.connect(addr5).registerPlayer(regTxParams)

    //// start round ////
    const placeBetParams = { value: ethers.utils.parseEther('5.0') }
    await squidBetStartRound.connect(addr1).placeBet('1', placeBetParams)
    await squidBetStartRound.connect(addr2).placeBet('1', placeBetParams)
    await squidBetStartRound.connect(addr3).placeBet('1', placeBetParams)
    await squidBetStartRound.connect(addr4).placeBet('1', placeBetParams)
    await squidBetStartRound.connect(addr5).placeBet('0', placeBetParams)
    await expect(
      squidBetStartRound.connect(addr6).placeBet('1', placeBetParams),
    ).to.be.revertedWith('revert')

    await squidBetStartRound.stopBet()
    await expect(
      squidBetStartRound.connect(addr1).stopBet(),
    ).to.be.revertedWith('Only Admin and Owner can perform this function')

    await squidBetStartRound.connect(oracle).reportResult('1', '0')
    await expect(
      squidBetStartRound.connect(addr1).reportResult('1', '0'),
    ).to.be.revertedWith('Only Oracle and Owner can perform this function')

    expect(await squidBetStartRound.getwinners(addr1.address)).to.equal(true)
    expect(await squidBetStartRound.getwinners(addr2.address)).to.equal(true)
    expect(await squidBetStartRound.getwinners(addr3.address)).to.equal(true)
    expect(await squidBetStartRound.getwinners(addr4.address)).to.equal(true)
    expect(await squidBetStartRound.getwinners(addr5.address)).to.equal(false)

    //// second round ////
    await squidBetSecondRound.connect(addr1).placeBet('0', placeBetParams)
    await squidBetSecondRound.connect(addr2).placeBet('0', placeBetParams)
    await squidBetSecondRound.connect(addr3).placeBet('0', placeBetParams)
    await squidBetSecondRound.connect(addr4).placeBet('1', placeBetParams)
    await expect(
      squidBetSecondRound.connect(addr5).placeBet('1', placeBetParams),
    ).to.be.revertedWith('Not a valid player')

    await squidBetSecondRound.stopBet()
    await squidBetSecondRound.connect(oracle).reportResult('0', '1')

    expect(await squidBetSecondRound.getwinners(addr1.address)).to.equal(true)
    expect(await squidBetSecondRound.getwinners(addr2.address)).to.equal(true)
    expect(await squidBetSecondRound.getwinners(addr3.address)).to.equal(true)
    expect(await squidBetSecondRound.getwinners(addr4.address)).to.equal(false)

    //// third round ////
    await squidBetThirdRound.connect(addr1).placeBet('0', placeBetParams)
    await squidBetThirdRound.connect(addr2).placeBet('0', placeBetParams)
    await squidBetThirdRound.connect(addr3).placeBet('1', placeBetParams)
    await expect(
      squidBetThirdRound.connect(addr4).placeBet('1', placeBetParams),
    ).to.be.revertedWith('Not a valid player')

    await squidBetThirdRound.stopBet()
    await squidBetThirdRound.connect(oracle).reportResult('0', '1')

    expect(await squidBetThirdRound.getwinners(addr1.address)).to.equal(true)
    expect(await squidBetThirdRound.getwinners(addr2.address)).to.equal(true)
    expect(await squidBetThirdRound.getwinners(addr3.address)).to.equal(false)

    //// Forth Round ////
    await squidBetForthRound.connect(addr1).placeBet('0', placeBetParams)
    await squidBetForthRound.connect(addr2).placeBet('0', placeBetParams)
    await expect(
      squidBetForthRound.connect(addr3).placeBet('1', placeBetParams),
    ).to.be.revertedWith('Not a valid player')

    await squidBetForthRound.stopBet()
    await squidBetForthRound.connect(oracle).reportResult('0', '1')

    expect(await squidBetForthRound.getwinners(addr1.address)).to.equal(true)
    expect(await squidBetForthRound.getwinners(addr2.address)).to.equal(true)

    //// Final Round ////
    await squidBetFinalRound.connect(addr1).placeBet('0', placeBetParams)
    await squidBetFinalRound.connect(addr2).placeBet('0', placeBetParams)

    await squidBetFinalRound.stopBet()
    await squidBetFinalRound.connect(oracle).reportResult(0, 1)
  })

  it('Cannot place bets twice', async function () {
    const regParams = { value: ethers.utils.parseEther('1.0') }
    await squidBetRegistration.connect(addr1).registerPlayer(regParams)
    await squidBetRegistration.connect(addr2).registerPlayer(regParams)

    const betParams = { value: ethers.utils.parseEther('5.0') }
    await squidBetStartRound.connect(addr1).placeBet('1', betParams)
    await expect(
      squidBetStartRound.connect(addr1).placeBet('1', betParams),
    ).to.be.revertedWith('Bet placed already')
  })

  it('SquidBets final round vote tie', async function () {
    let currVote = await squidBetFinalRound.vote()

    expect(currVote).to.eq(0)

    const regParams = { value: ethers.utils.parseEther('1.0') }
    await squidBetRegistration.connect(addr1).registerPlayer(regParams)
    await squidBetRegistration.connect(addr2).registerPlayer(regParams)

    //// first round ////
    const betParams = { value: ethers.utils.parseEther('5.0') }
    await squidBetStartRound.connect(addr1).placeBet('1', betParams)
    await squidBetStartRound.connect(addr2).placeBet('1', betParams)
    await squidBetStartRound.stopBet()
    await squidBetStartRound.connect(oracle).reportResult('1', '0')
    expect(await squidBetStartRound.getwinners(addr1.address)).to.equal(true)
    expect(await squidBetStartRound.getwinners(addr2.address)).to.equal(true)

    //// second round ////
    await squidBetSecondRound.connect(addr1).placeBet('0', betParams)
    await squidBetSecondRound.connect(addr2).placeBet('0', betParams)
    await squidBetSecondRound.stopBet()
    await squidBetSecondRound.connect(oracle).reportResult('0', '1')
    expect(await squidBetSecondRound.getwinners(addr1.address)).to.equal(true)
    expect(await squidBetSecondRound.getwinners(addr2.address)).to.equal(true)

    //// third round ////
    await squidBetThirdRound.connect(addr1).placeBet('0', betParams)
    await squidBetThirdRound.connect(addr2).placeBet('0', betParams)
    await squidBetThirdRound.stopBet()
    await squidBetThirdRound.connect(oracle).reportResult('0', '1')
    expect(await squidBetThirdRound.getwinners(addr1.address)).to.equal(true)
    expect(await squidBetThirdRound.getwinners(addr2.address)).to.equal(true)

    //// forth Round ////
    await squidBetForthRound.connect(addr1).placeBet('0', betParams)
    await squidBetForthRound.connect(addr2).placeBet('0', betParams)
    await squidBetForthRound.stopBet()
    await squidBetForthRound.connect(oracle).reportResult('0', '1')
    expect(await squidBetForthRound.getwinners(addr1.address)).to.equal(true)
    expect(await squidBetForthRound.getwinners(addr2.address)).to.equal(true)

    //// final round ////
    await squidBetFinalRound.connect(addr1).placeBet('0', betParams)
    await squidBetFinalRound.connect(addr2).placeBet('0', betParams)
    await squidBetFinalRound.stopBet()
    await squidBetFinalRound.connect(oracle).reportResult(0, 1)
    expect(await squidBetForthRound.getwinners(addr1.address)).to.equal(true)
    expect(await squidBetForthRound.getwinners(addr2.address)).to.equal(true)

    //// voting ////
    await squidBetFinalRound.connect(addr1).Vote(1)
    currVote = await squidBetFinalRound.vote()
    expect(currVote).to.eq(1)

    await squidBetFinalRound.connect(addr2).Vote(2)
    currVote = await squidBetFinalRound.vote()
    expect(currVote).to.eq(0)

    await squidBetFinalRound.stopVote()
    await squidBetFinalRound.resultVote()

    const res = await squidBetFinalRound.finalVoteDecision()

    expect(res).to.eq(
      'Random Draw will decide the only Winner of the Squid Bet Competition',
    )
  })

  it('SquidBets final round vote side 1 wins', async function () {
    let currVote = await squidBetFinalRound.vote()

    expect(currVote).to.eq(0)

    await squidBetRegistration
      .connect(addr1)
      .registerPlayer({ value: ethers.utils.parseEther('1.0') })
    await squidBetRegistration
      .connect(addr2)
      .registerPlayer({ value: ethers.utils.parseEther('1.0') })

    await squidBetStartRound
      .connect(addr1)
      .placeBet('1', { value: ethers.utils.parseEther('5.0') })
    await squidBetStartRound
      .connect(addr2)
      .placeBet('1', { value: ethers.utils.parseEther('5.0') })

    await squidBetStartRound.stopBet()
    await expect(
      squidBetStartRound.connect(addr1).stopBet(),
    ).to.be.revertedWith('Only Admin and Owner can perform this function')

    await squidBetStartRound.connect(oracle).reportResult('1', '0')
    await expect(
      squidBetStartRound.connect(addr1).reportResult('1', '0'),
    ).to.be.revertedWith('Only Oracle and Owner can perform this function')

    expect(await squidBetStartRound.getwinners(addr1.address)).to.equal(true)
    expect(await squidBetStartRound.getwinners(addr2.address)).to.equal(true)

    ///second

    await squidBetSecondRound
      .connect(addr1)
      .placeBet('0', { value: ethers.utils.parseEther('5.0') })
    await squidBetSecondRound
      .connect(addr2)
      .placeBet('0', { value: ethers.utils.parseEther('5.0') })
    await expect(
      squidBetSecondRound
        .connect(addr5)
        .placeBet('1', { value: ethers.utils.parseEther('5.0') }),
    ).to.be.revertedWith('Not a valid player')

    await squidBetSecondRound.stopBet()
    await squidBetSecondRound.connect(oracle).reportResult('0', '1')

    expect(await squidBetSecondRound.getwinners(addr1.address)).to.equal(true)
    expect(await squidBetSecondRound.getwinners(addr2.address)).to.equal(true)

    ///////// third round////
    await squidBetThirdRound
      .connect(addr1)
      .placeBet('0', { value: ethers.utils.parseEther('5.0') })
    await squidBetThirdRound
      .connect(addr2)
      .placeBet('0', { value: ethers.utils.parseEther('5.0') })

    await squidBetThirdRound.stopBet()
    await squidBetThirdRound.connect(oracle).reportResult('0', '1')

    expect(await squidBetThirdRound.getwinners(addr1.address)).to.equal(true)
    expect(await squidBetThirdRound.getwinners(addr2.address)).to.equal(true)

    ////Forth Round////

    await squidBetForthRound
      .connect(addr1)
      .placeBet('0', { value: ethers.utils.parseEther('5.0') })
    await squidBetForthRound
      .connect(addr2)
      .placeBet('0', { value: ethers.utils.parseEther('5.0') })

    await squidBetForthRound.stopBet()
    await squidBetForthRound.connect(oracle).reportResult('0', '1')

    expect(await squidBetForthRound.getwinners(addr1.address)).to.equal(true)
    expect(await squidBetForthRound.getwinners(addr2.address)).to.equal(true)

    await squidBetFinalRound
      .connect(addr1)
      .placeBet('0', { value: ethers.utils.parseEther('5.0') })
    await squidBetFinalRound
      .connect(addr2)
      .placeBet('0', { value: ethers.utils.parseEther('5.0') })

    await squidBetFinalRound.stopBet()
    await squidBetFinalRound.connect(oracle).reportResult(0, 1)

    await squidBetFinalRound.connect(addr1).Vote(1)

    currVote = await squidBetFinalRound.vote()
    expect(currVote).to.eq(1)

    await squidBetFinalRound.connect(addr2).Vote(1)

    currVote = await squidBetFinalRound.vote()
    expect(currVote).to.eq(2)

    await squidBetFinalRound.stopVote()
    await squidBetFinalRound.resultVote()

    const res = await squidBetFinalRound.finalVoteDecision()

    expect(res).to.eq(
      'Split The Prize Pool equally between every last final Players remaining in the Squid Bet Competition',
    )
  })

  it('SquidBets final round vote side 2 wins', async function () {
    let currVote = await squidBetFinalRound.vote()

    expect(currVote).to.eq(0)

    await squidBetRegistration
      .connect(addr1)
      .registerPlayer({ value: ethers.utils.parseEther('1.0') })
    await squidBetRegistration
      .connect(addr2)
      .registerPlayer({ value: ethers.utils.parseEther('1.0') })

    await squidBetStartRound
      .connect(addr1)
      .placeBet('1', { value: ethers.utils.parseEther('5.0') })
    await squidBetStartRound
      .connect(addr2)
      .placeBet('1', { value: ethers.utils.parseEther('5.0') })

    await squidBetStartRound.stopBet()
    await expect(
      squidBetStartRound.connect(addr1).stopBet(),
    ).to.be.revertedWith('Only Admin and Owner can perform this function')

    await squidBetStartRound.connect(oracle).reportResult('1', '0')
    await expect(
      squidBetStartRound.connect(addr1).reportResult('1', '0'),
    ).to.be.revertedWith('Only Oracle and Owner can perform this function')

    expect(await squidBetStartRound.getwinners(addr1.address)).to.equal(true)
    expect(await squidBetStartRound.getwinners(addr2.address)).to.equal(true)

    ///second

    await squidBetSecondRound
      .connect(addr1)
      .placeBet('0', { value: ethers.utils.parseEther('5.0') })
    await squidBetSecondRound
      .connect(addr2)
      .placeBet('0', { value: ethers.utils.parseEther('5.0') })
    await expect(
      squidBetSecondRound
        .connect(addr5)
        .placeBet('1', { value: ethers.utils.parseEther('5.0') }),
    ).to.be.revertedWith('Not a valid player')

    await squidBetSecondRound.stopBet()
    await squidBetSecondRound.connect(oracle).reportResult('0', '1')

    expect(await squidBetSecondRound.getwinners(addr1.address)).to.equal(true)
    expect(await squidBetSecondRound.getwinners(addr2.address)).to.equal(true)

    ///////// third round////
    await squidBetThirdRound
      .connect(addr1)
      .placeBet('0', { value: ethers.utils.parseEther('5.0') })
    await squidBetThirdRound
      .connect(addr2)
      .placeBet('0', { value: ethers.utils.parseEther('5.0') })

    await squidBetThirdRound.stopBet()
    await squidBetThirdRound.connect(oracle).reportResult('0', '1')

    expect(await squidBetThirdRound.getwinners(addr1.address)).to.equal(true)
    expect(await squidBetThirdRound.getwinners(addr2.address)).to.equal(true)

    ////Forth Round////

    await squidBetForthRound
      .connect(addr1)
      .placeBet('0', { value: ethers.utils.parseEther('5.0') })
    await squidBetForthRound
      .connect(addr2)
      .placeBet('0', { value: ethers.utils.parseEther('5.0') })

    await squidBetForthRound.stopBet()
    await squidBetForthRound.connect(oracle).reportResult('0', '1')

    expect(await squidBetForthRound.getwinners(addr1.address)).to.equal(true)
    expect(await squidBetForthRound.getwinners(addr2.address)).to.equal(true)

    await squidBetFinalRound
      .connect(addr1)
      .placeBet('0', { value: ethers.utils.parseEther('5.0') })
    await squidBetFinalRound
      .connect(addr2)
      .placeBet('0', { value: ethers.utils.parseEther('5.0') })

    await squidBetFinalRound.stopBet()
    await squidBetFinalRound.connect(oracle).reportResult(0, 1)

    await squidBetFinalRound.connect(addr1).Vote(2)

    currVote = await squidBetFinalRound.vote()
    expect(currVote).to.eq(-1)

    await squidBetFinalRound.connect(addr2).Vote(2)

    currVote = await squidBetFinalRound.vote()
    expect(currVote).to.eq(-2)

    await squidBetFinalRound.stopVote()
    await squidBetFinalRound.resultVote()

    const res = await squidBetFinalRound.finalVoteDecision()

    expect(res).to.eq(
      'Random Draw will decide the only Winner of the Squid Bet Competition',
    )
  })

  it("Non-winners can't vote final round", async function () {
    let currVote = await squidBetFinalRound.vote()

    expect(currVote).to.eq(0)
    await expect(squidBetFinalRound.connect(addr1).Vote(1)).to.be.revertedWith(
      'You do not have any winning bet',
    )
  })

  it('Squidbets cancel event', async function () {
    await squidBetRegistration
      .connect(addr1)
      .registerPlayer({ value: ethers.utils.parseEther('1.0') })
    await squidBetRegistration
      .connect(addr2)
      .registerPlayer({ value: ethers.utils.parseEther('1.0') })

    await squidBetStartRound
      .connect(addr1)
      .placeBet('1', { value: ethers.utils.parseEther('5.0') })
    await squidBetStartRound
      .connect(addr2)
      .placeBet('1', { value: ethers.utils.parseEther('5.0') })

    await squidBetStartRound.cancelEvent()

    const bal1Before = await ethers.provider.getBalance(addr1.address)

    await squidBetStartRound.connect(addr1).claimBetCancelledEvent()

    const bal1After = await ethers.provider.getBalance(addr2.address)

    expect(bal1Before).to.lt(bal1After)

    const bal2Before = await ethers.provider.getBalance(addr1.address)

    await squidBetStartRound.connect(addr2).claimBetCancelledEvent()

    const bal2After = await ethers.provider.getBalance(addr2.address)

    expect(bal2Before).to.lt(bal2After)
  })

  it("Can't claim cancelled twice", async function () {
    await squidBetRegistration
      .connect(addr1)
      .registerPlayer({ value: ethers.utils.parseEther('1.0') })
    await squidBetRegistration
      .connect(addr2)
      .registerPlayer({ value: ethers.utils.parseEther('1.0') })

    await squidBetStartRound
      .connect(addr1)
      .placeBet('1', { value: ethers.utils.parseEther('5.0') })
    await squidBetStartRound
      .connect(addr2)
      .placeBet('1', { value: ethers.utils.parseEther('5.0') })

    await squidBetStartRound.cancelEvent()

    const bal1Before = await ethers.provider.getBalance(addr1.address)

    await squidBetStartRound.connect(addr1).claimBetCancelledEvent()

    const bal1After = await ethers.provider.getBalance(addr2.address)

    expect(bal1Before).to.lt(bal1After)

    await expect(
      squidBetStartRound.connect(addr1).claimBetCancelledEvent(),
    ).to.be.revertedWith('You do not make any bets')
  })

  it("Squidbets can't report same winner", async function () {
    await squidBetRegistration
      .connect(addr1)
      .registerPlayer({ value: ethers.utils.parseEther('1.0') })
    await squidBetRegistration
      .connect(addr2)
      .registerPlayer({ value: ethers.utils.parseEther('1.0') })

    await squidBetStartRound
      .connect(addr1)
      .placeBet('1', { value: ethers.utils.parseEther('5.0') })
    await squidBetStartRound
      .connect(addr2)
      .placeBet('1', { value: ethers.utils.parseEther('5.0') })

    await squidBetStartRound.stopBet()
    await expect(
      squidBetStartRound.connect(addr1).stopBet(),
    ).to.be.revertedWith('Only Admin and Owner can perform this function')

    await expect(
      squidBetStartRound.connect(oracle).reportResult('1', '1'),
    ).to.be.revertedWith('Winner and loser cannot be the same')
  })

  it('Squidbets prize pool withdraw single then withdraw all', async function () {
    await squidBetPrizePool.addMultipleWinnersAddress([
      addr1.address,
      addr2.address,
      addr3.address,
      addr4.address,
      addr5.address,
    ])

    const balBefore1 = await ethers.provider.getBalance(addr1.address)

    await squidBetPrizePool.connect(addr1).winnerClaimPrizePool()

    const balAfter1 = await ethers.provider.getBalance(addr1.address)

    expect(balBefore1).to.lt(balAfter1)

    const balBefore2 = await ethers.provider.getBalance(addr2.address)
    const balBefore3 = await ethers.provider.getBalance(addr3.address)

    await squidBetPrizePool.winnersClaimPrizePool()

    const balAfter2 = await ethers.provider.getBalance(addr2.address)
    const balAfter3 = await ethers.provider.getBalance(addr3.address)
    const balAfterAfter1 = await ethers.provider.getBalance(addr1.address)

    expect(balBefore2).to.lt(balAfter2)
    expect(balBefore3).to.lt(balAfter3)
    expect(balAfter1).to.eq(balAfterAfter1)
  })

  it("Squidbets prize pool withdraw all then can't withdraw single", async function () {
    await squidBetPrizePool.addMultipleWinnersAddress([
      addr1.address,
      addr2.address,
      addr3.address,
      addr4.address,
      addr5.address,
    ])

    const balBefore1 = await ethers.provider.getBalance(addr1.address)
    const balBefore2 = await ethers.provider.getBalance(addr2.address)
    const balBefore3 = await ethers.provider.getBalance(addr3.address)
    const balBefore4 = await ethers.provider.getBalance(addr4.address)
    const balBefore5 = await ethers.provider.getBalance(addr5.address)

    await squidBetPrizePool.winnersClaimPrizePool()

    const balAfter1 = await ethers.provider.getBalance(addr1.address)
    const balAfter2 = await ethers.provider.getBalance(addr2.address)
    const balAfter3 = await ethers.provider.getBalance(addr3.address)
    const balAfter4 = await ethers.provider.getBalance(addr4.address)
    const balAfter5 = await ethers.provider.getBalance(addr5.address)

    expect(balBefore1).to.lt(balAfter1)
    expect(balBefore2).to.lt(balAfter2)
    expect(balBefore3).to.lt(balAfter3)
    expect(balBefore4).to.lt(balAfter4)
    expect(balBefore5).to.lt(balAfter5)

    await expect(
      squidBetPrizePool.connect(addr1).winnerClaimPrizePool(),
    ).to.be.revertedWith(
      'Only a Winner of the Squid Bet Competition can claim the Prize Pool',
    )
  })

  it("Squidbets prize pool non-winner can't withdraw", async function () {
    await squidBetPrizePool.addMultipleWinnersAddress([
      addr1.address,
      addr2.address,
      addr3.address,
      addr4.address,
      addr5.address,
    ])

    await expect(
      squidBetPrizePool.connect(addr6).winnerClaimPrizePool(),
    ).to.be.revertedWith(
      'Only a Winner of the Squid Bet Competition can claim the Prize Pool',
    )
  })

  it("Squidbets prize pool winner can't withdraw twice", async function () {
    await squidBetPrizePool.addMultipleWinnersAddress([
      addr1.address,
      addr2.address,
      addr3.address,
      addr4.address,
      addr5.address,
    ])

    const balBefore1 = await ethers.provider.getBalance(addr1.address)

    await squidBetPrizePool.connect(addr1).winnerClaimPrizePool()

    const balAfter1 = await ethers.provider.getBalance(addr1.address)

    expect(balBefore1).to.lt(balAfter1)

    await expect(
      squidBetPrizePool.connect(addr6).winnerClaimPrizePool(),
    ).to.be.revertedWith(
      'Only a Winner of the Squid Bet Competition can claim the Prize Pool',
    )
    await expect(
      squidBetPrizePool.connect(addr1).winnerClaimPrizePool(),
    ).to.be.revertedWith(
      'Only a Winner of the Squid Bet Competition can claim the Prize Pool',
    )
  })
})
