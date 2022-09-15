const { expect } = require('chai')
const { ethers } = require('hardhat')

/**
 * @dev Read more at https://docs.chain.link/docs/chainlink-vrf/
 */
 const BASE_FEE = "100000000000000000"
 const GAS_PRICE_LINK = "1000000000" // 0.000000001 LINK per gas


let Admin
let PrizePool
let Treasury
let oracle
let addr1
let addr2
let addr3
let addr4
let addr5
let addr6
let addr7
let addr8
let addr9
let addr10

describe('SquidBets', function () {
  beforeEach(async function () {
    //////////////////////////////////get contract Factory ///////////////////////////////////////////
    const VRFCoordinatorV2Mock = await ethers.getContractFactory(
      'VRFCoordinatorV2Mock',
    )
    const LinkToken = await ethers.getContractFactory('LinkToken')
    const VRFv2SubscriptionManager = await ethers.getContractFactory(
      'VRFv2SubscriptionManager',
    )
    const SquidBetPlayersRegistration = await ethers.getContractFactory(
      'SquidBetPlayersRegistration',
    )
    const SquidBetStartRound = await ethers.getContractFactory(
      'SquidBetStartRound',
    )
    const SquidBetSecondRound = await ethers.getContractFactory(
      'SquidBetSecondRound',
    )
    const SquidBetThirdRound = await ethers.getContractFactory(
      'SquidBetThirdRound',
    )
    const SquidBetForthRound = await ethers.getContractFactory(
      'SquidBetForthRound',
    )
    const SquidBetFinalRound = await ethers.getContractFactory(
      'SquidBetFinalRound',
    )
    const SquidBetPrizePool = await ethers.getContractFactory(
      'SquidBetPrizePool',
    )

    ////////////////////////////////////////////////////////////// deploy////////////////////////////
    ;[
      Admin,
      oracle,
      addr1,
      addr2,
      addr3,
      addr4,
      addr5,
      addr6,
      addr7,
      addr8,
      addr9,
      addr10,
      Treasury,
      PrizePool,
    ] = await ethers.getSigners()
    // Chainlink VRF
    this.vrfCondinator = await VRFCoordinatorV2Mock.deploy(BASE_FEE, GAS_PRICE_LINK)
    this.linkToken = await LinkToken.deploy()
    this.vrf = await VRFv2SubscriptionManager.deploy(
      this.vrfCondinator.address,
      this.linkToken.address,
      '0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc',
    )

    //player registration
    this.squidBetPlayersRegistration = await SquidBetPlayersRegistration.deploy(
      Treasury.address,
      PrizePool.address,
    )
    ///start round
    this.squidBetStartRound = await SquidBetStartRound.deploy(
      PrizePool.address,
      this.squidBetPlayersRegistration.address,
    )
    ///second round
    this.squidBetSecondRound = await SquidBetSecondRound.deploy(
      PrizePool.address,
      this.squidBetStartRound.address,
    )
    /// third round

    this.squidBetThirdRound = await SquidBetThirdRound.deploy(
      PrizePool.address,
      this.squidBetSecondRound.address,
    )

    ///// Forth round

    this.squidBetForthRound = await SquidBetForthRound.deploy(
      PrizePool.address,
      this.squidBetThirdRound.address,
    )

    ///// Final Round ///

    this.squidBetFinalRound = await SquidBetFinalRound.deploy(
      PrizePool.address,
      this.squidBetForthRound.address,
      this.vrf.address,
    )

    this.squidBetPrizePool = await SquidBetPrizePool.deploy(Treasury.address)

    //console.log( this.squidBetSecondRound.address,  this.squidBetThirdRound.address )

    /////////////////deployed////////////////////////////////////////////

    await this.vrf.deployed()
    await this.squidBetPlayersRegistration.deployed()
    await this.squidBetStartRound.deployed()
    await this.squidBetSecondRound.deployed()
    await this.squidBetThirdRound.deployed()
    await this.squidBetForthRound.deployed()
    await this.squidBetFinalRound.deployed()
    await this.squidBetPrizePool.deployed()

    await this.vrf.connect(Admin).addOracle(oracle.address)
    await this.squidBetPlayersRegistration
      .connect(Admin)
      .addOracle(oracle.address)
    await this.squidBetStartRound.connect(Admin).addOracle(oracle.address)
    await this.squidBetSecondRound.connect(Admin).addOracle(oracle.address)
    await this.squidBetThirdRound.connect(Admin).addOracle(oracle.address)
    await this.squidBetForthRound.connect(Admin).addOracle(oracle.address)
    await this.squidBetFinalRound.connect(Admin).addOracle(oracle.address)

    let tx = {
      to: this.squidBetPrizePool.address,
      // Convert currency unit from ether to wei
      value: ethers.utils.parseEther('10'),
    }

    await addr1.sendTransaction(tx)
  })

  it('it does basic checks', async function () {
    await this.squidBetPlayersRegistration
      .connect(addr1)
      .registerPlayer({ value: ethers.utils.parseEther('1.0') })
    await this.squidBetPlayersRegistration
      .connect(addr2)
      .registerPlayer({ value: ethers.utils.parseEther('1.0') })
    await this.squidBetPlayersRegistration
      .connect(addr3)
      .registerPlayer({ value: ethers.utils.parseEther('1.0') })
    await this.squidBetPlayersRegistration
      .connect(addr4)
      .registerPlayer({ value: ethers.utils.parseEther('1.0') })
    await this.squidBetPlayersRegistration
      .connect(addr5)
      .registerPlayer({ value: ethers.utils.parseEther('1.0') })
    // await this.squidBetPlayersRegistration.connect(addr6).registerPlayer({value: ethers.utils.parseEther("1.0")});
    // await this.squidBetPlayersRegistration.connect(addr7).registerPlayer({value: ethers.utils.parseEther("1.0")});
    // await this.squidBetPlayersRegistration.connect(addr8).registerPlayer({value: ethers.utils.parseEther("1.0")});
    // await this.squidBetPlayersRegistration.connect(addr9).registerPlayer({value: ethers.utils.parseEther("1.0")});
    // await this.squidBetPlayersRegistration.connect(addr10).registerPlayer({value: ethers.utils.parseEther("1.0")});

    expect(await this.squidBetPlayersRegistration.totalPlayerNumber()).to.equal(
      '5',
    )
    expect(
      await this.squidBetPlayersRegistration.getRegisterPlayerCount(),
    ).to.equal('5')
    expect(await this.squidBetPlayersRegistration.getBalance()).to.equal(
      ethers.utils.parseEther('4.5'),
    )
    expect(
      await this.squidBetPlayersRegistration.getIsRegisteredPlayer(
        addr1.address,
      ),
    ).to.equal(true)
    expect(
      await this.squidBetPlayersRegistration.getIsRegisteredPlayer(
        addr2.address,
      ),
    ).to.equal(true)
    expect(
      await this.squidBetPlayersRegistration.getIsRegisteredPlayer(
        addr3.address,
      ),
    ).to.equal(true)
    expect(
      await this.squidBetPlayersRegistration.getIsRegisteredPlayer(
        addr4.address,
      ),
    ).to.equal(true)
    expect(
      await this.squidBetPlayersRegistration.getIsRegisteredPlayer(
        addr5.address,
      ),
    ).to.equal(true)
  })

  it('check if registered players are inherited across contract', async function () {
    await this.squidBetPlayersRegistration
      .connect(addr1)
      .registerPlayer({ value: ethers.utils.parseEther('1.0') })
    await this.squidBetPlayersRegistration
      .connect(addr2)
      .registerPlayer({ value: ethers.utils.parseEther('1.0') })
    await this.squidBetPlayersRegistration
      .connect(addr3)
      .registerPlayer({ value: ethers.utils.parseEther('1.0') })
    await this.squidBetPlayersRegistration
      .connect(addr4)
      .registerPlayer({ value: ethers.utils.parseEther('1.0') })
    await this.squidBetPlayersRegistration
      .connect(addr5)
      .registerPlayer({ value: ethers.utils.parseEther('1.0') })

    await this.squidBetStartRound
      .connect(addr1)
      .placeBet('1', { value: ethers.utils.parseEther('5.0') })
    await this.squidBetStartRound
      .connect(addr2)
      .placeBet('1', { value: ethers.utils.parseEther('5.0') })
    await this.squidBetStartRound
      .connect(addr3)
      .placeBet('1', { value: ethers.utils.parseEther('5.0') })
    await this.squidBetStartRound
      .connect(addr4)
      .placeBet('1', { value: ethers.utils.parseEther('5.0') })
    await this.squidBetStartRound
      .connect(addr5)
      .placeBet('0', { value: ethers.utils.parseEther('5.0') })
    await expect(
      this.squidBetStartRound
        .connect(addr6)
        .placeBet('1', { value: ethers.utils.parseEther('5.0') }),
    ).to.be.revertedWith('revert')

    await this.squidBetStartRound.connect(Admin).stopBet()
    await expect(
      this.squidBetStartRound.connect(addr1).stopBet(),
    ).to.be.revertedWith('Only Admin and Owner can perform this function')

    await this.squidBetStartRound.connect(oracle).reportResult('1', '0')
    await expect(
      this.squidBetStartRound.connect(addr1).reportResult('1', '0'),
    ).to.be.revertedWith('Only Oracle and Owner can perform this function')

    expect(await this.squidBetStartRound.getwinners(addr1.address)).to.equal(
      true,
    )
    expect(await this.squidBetStartRound.getwinners(addr2.address)).to.equal(
      true,
    )
    expect(await this.squidBetStartRound.getwinners(addr3.address)).to.equal(
      true,
    )
    expect(await this.squidBetStartRound.getwinners(addr4.address)).to.equal(
      true,
    )
    expect(await this.squidBetStartRound.getwinners(addr5.address)).to.equal(
      false,
    )

    ///second

    await this.squidBetSecondRound
      .connect(addr1)
      .placeBet('0', { value: ethers.utils.parseEther('5.0') })
    await this.squidBetSecondRound
      .connect(addr2)
      .placeBet('0', { value: ethers.utils.parseEther('5.0') })
    await this.squidBetSecondRound
      .connect(addr3)
      .placeBet('0', { value: ethers.utils.parseEther('5.0') })
    await this.squidBetSecondRound
      .connect(addr4)
      .placeBet('1', { value: ethers.utils.parseEther('5.0') })
    await expect(
      this.squidBetSecondRound
        .connect(addr5)
        .placeBet('1', { value: ethers.utils.parseEther('5.0') }),
    ).to.be.revertedWith('Not a valid player')

    await this.squidBetSecondRound.connect(Admin).stopBet()
    await this.squidBetSecondRound.connect(oracle).reportResult('0', '1')

    expect(await this.squidBetSecondRound.getwinners(addr1.address)).to.equal(
      true,
    )
    expect(await this.squidBetSecondRound.getwinners(addr2.address)).to.equal(
      true,
    )
    expect(await this.squidBetSecondRound.getwinners(addr3.address)).to.equal(
      true,
    )
    expect(await this.squidBetSecondRound.getwinners(addr4.address)).to.equal(
      false,
    )

    ///////// third round////
    await this.squidBetThirdRound
      .connect(addr1)
      .placeBet('0', { value: ethers.utils.parseEther('5.0') })
    await this.squidBetThirdRound
      .connect(addr2)
      .placeBet('0', { value: ethers.utils.parseEther('5.0') })
    await this.squidBetThirdRound
      .connect(addr3)
      .placeBet('1', { value: ethers.utils.parseEther('5.0') })
    await expect(
      this.squidBetThirdRound
        .connect(addr4)
        .placeBet('1', { value: ethers.utils.parseEther('5.0') }),
    ).to.be.revertedWith('Not a valid player')

    await this.squidBetThirdRound.connect(Admin).stopBet()
    await this.squidBetThirdRound.connect(oracle).reportResult('0', '1')

    expect(await this.squidBetThirdRound.getwinners(addr1.address)).to.equal(
      true,
    )
    expect(await this.squidBetThirdRound.getwinners(addr2.address)).to.equal(
      true,
    )
    expect(await this.squidBetThirdRound.getwinners(addr3.address)).to.equal(
      false,
    )

    ////Forth Round////

    await this.squidBetForthRound
      .connect(addr1)
      .placeBet('0', { value: ethers.utils.parseEther('5.0') })
    await this.squidBetForthRound
      .connect(addr2)
      .placeBet('0', { value: ethers.utils.parseEther('5.0') })
    await expect(
      this.squidBetForthRound
        .connect(addr3)
        .placeBet('1', { value: ethers.utils.parseEther('5.0') }),
    ).to.be.revertedWith('Not a valid player')

    await this.squidBetForthRound.connect(Admin).stopBet()
    await this.squidBetForthRound.connect(oracle).reportResult('0', '1')

    expect(await this.squidBetForthRound.getwinners(addr1.address)).to.equal(
      true,
    )
    expect(await this.squidBetForthRound.getwinners(addr2.address)).to.equal(
      true,
    )

    ////Final Round ////

    await this.squidBetFinalRound
      .connect(addr1)
      .placeBet('0', { value: ethers.utils.parseEther('5.0') })
    await this.squidBetFinalRound
      .connect(addr2)
      .placeBet('0', { value: ethers.utils.parseEther('5.0') })

    await this.squidBetFinalRound.stopBet()
    await this.squidBetFinalRound.connect(oracle).reportResult(0, 1)
  })

  it('SquidBets round cannot place bets twice', async function () {
    await this.squidBetPlayersRegistration
      .connect(addr1)
      .registerPlayer({ value: ethers.utils.parseEther('1.0') })
    await this.squidBetPlayersRegistration
      .connect(addr2)
      .registerPlayer({ value: ethers.utils.parseEther('1.0') })

    await this.squidBetStartRound
      .connect(addr1)
      .placeBet('1', { value: ethers.utils.parseEther('5.0') })
    await expect(
      this.squidBetStartRound
        .connect(addr1)
        .placeBet('1', { value: ethers.utils.parseEther('5.0') }),
    ).to.be.revertedWith('Bet placed already')
  })

  it('SquidBets final round vote tie', async function () {
    let currVote = await this.squidBetFinalRound.vote()

    expect(currVote).to.eq(0)

    await this.squidBetPlayersRegistration
      .connect(addr1)
      .registerPlayer({ value: ethers.utils.parseEther('1.0') })
    await this.squidBetPlayersRegistration
      .connect(addr2)
      .registerPlayer({ value: ethers.utils.parseEther('1.0') })

    await this.squidBetStartRound
      .connect(addr1)
      .placeBet('1', { value: ethers.utils.parseEther('5.0') })
    await this.squidBetStartRound
      .connect(addr2)
      .placeBet('1', { value: ethers.utils.parseEther('5.0') })

    await this.squidBetStartRound.connect(Admin).stopBet()
    await expect(
      this.squidBetStartRound.connect(addr1).stopBet(),
    ).to.be.revertedWith('Only Admin and Owner can perform this function')

    await this.squidBetStartRound.connect(oracle).reportResult('1', '0')
    await expect(
      this.squidBetStartRound.connect(addr1).reportResult('1', '0'),
    ).to.be.revertedWith('Only Oracle and Owner can perform this function')

    expect(await this.squidBetStartRound.getwinners(addr1.address)).to.equal(
      true,
    )
    expect(await this.squidBetStartRound.getwinners(addr2.address)).to.equal(
      true,
    )

    ///second

    await this.squidBetSecondRound
      .connect(addr1)
      .placeBet('0', { value: ethers.utils.parseEther('5.0') })
    await this.squidBetSecondRound
      .connect(addr2)
      .placeBet('0', { value: ethers.utils.parseEther('5.0') })
    await expect(
      this.squidBetSecondRound
        .connect(addr5)
        .placeBet('1', { value: ethers.utils.parseEther('5.0') }),
    ).to.be.revertedWith('Not a valid player')

    await this.squidBetSecondRound.connect(Admin).stopBet()
    await this.squidBetSecondRound.connect(oracle).reportResult('0', '1')

    expect(await this.squidBetSecondRound.getwinners(addr1.address)).to.equal(
      true,
    )
    expect(await this.squidBetSecondRound.getwinners(addr2.address)).to.equal(
      true,
    )

    ///////// third round////
    await this.squidBetThirdRound
      .connect(addr1)
      .placeBet('0', { value: ethers.utils.parseEther('5.0') })
    await this.squidBetThirdRound
      .connect(addr2)
      .placeBet('0', { value: ethers.utils.parseEther('5.0') })

    await this.squidBetThirdRound.connect(Admin).stopBet()
    await this.squidBetThirdRound.connect(oracle).reportResult('0', '1')

    expect(await this.squidBetThirdRound.getwinners(addr1.address)).to.equal(
      true,
    )
    expect(await this.squidBetThirdRound.getwinners(addr2.address)).to.equal(
      true,
    )

    ////Forth Round////

    await this.squidBetForthRound
      .connect(addr1)
      .placeBet('0', { value: ethers.utils.parseEther('5.0') })
    await this.squidBetForthRound
      .connect(addr2)
      .placeBet('0', { value: ethers.utils.parseEther('5.0') })

    await this.squidBetForthRound.connect(Admin).stopBet()
    await this.squidBetForthRound.connect(oracle).reportResult('0', '1')

    expect(await this.squidBetForthRound.getwinners(addr1.address)).to.equal(
      true,
    )
    expect(await this.squidBetForthRound.getwinners(addr2.address)).to.equal(
      true,
    )

    await this.squidBetFinalRound
      .connect(addr1)
      .placeBet('0', { value: ethers.utils.parseEther('5.0') })
    await this.squidBetFinalRound
      .connect(addr2)
      .placeBet('0', { value: ethers.utils.parseEther('5.0') })

    await this.squidBetFinalRound.stopBet()
    await this.squidBetFinalRound.connect(oracle).reportResult(0, 1)

    await this.squidBetFinalRound.connect(addr1).Vote(1)

    currVote = await this.squidBetFinalRound.vote()
    expect(currVote).to.eq(1)

    await this.squidBetFinalRound.connect(addr2).Vote(2)

    currVote = await this.squidBetFinalRound.vote()
    expect(currVote).to.eq(0)

    await this.squidBetFinalRound.stopVote()
    await this.squidBetFinalRound.resultVote()

    const res = await this.squidBetFinalRound.finalVoteDecision()

    expect(res).to.eq(
      'Random Draw will decide the only Winner of the Squid Bet Competition',
    )
  })

  it('SquidBets final round vote side 1 wins', async function () {
    let currVote = await this.squidBetFinalRound.vote()

    expect(currVote).to.eq(0)

    await this.squidBetPlayersRegistration
      .connect(addr1)
      .registerPlayer({ value: ethers.utils.parseEther('1.0') })
    await this.squidBetPlayersRegistration
      .connect(addr2)
      .registerPlayer({ value: ethers.utils.parseEther('1.0') })

    await this.squidBetStartRound
      .connect(addr1)
      .placeBet('1', { value: ethers.utils.parseEther('5.0') })
    await this.squidBetStartRound
      .connect(addr2)
      .placeBet('1', { value: ethers.utils.parseEther('5.0') })

    await this.squidBetStartRound.connect(Admin).stopBet()
    await expect(
      this.squidBetStartRound.connect(addr1).stopBet(),
    ).to.be.revertedWith('Only Admin and Owner can perform this function')

    await this.squidBetStartRound.connect(oracle).reportResult('1', '0')
    await expect(
      this.squidBetStartRound.connect(addr1).reportResult('1', '0'),
    ).to.be.revertedWith('Only Oracle and Owner can perform this function')

    expect(await this.squidBetStartRound.getwinners(addr1.address)).to.equal(
      true,
    )
    expect(await this.squidBetStartRound.getwinners(addr2.address)).to.equal(
      true,
    )

    ///second

    await this.squidBetSecondRound
      .connect(addr1)
      .placeBet('0', { value: ethers.utils.parseEther('5.0') })
    await this.squidBetSecondRound
      .connect(addr2)
      .placeBet('0', { value: ethers.utils.parseEther('5.0') })
    await expect(
      this.squidBetSecondRound
        .connect(addr5)
        .placeBet('1', { value: ethers.utils.parseEther('5.0') }),
    ).to.be.revertedWith('Not a valid player')

    await this.squidBetSecondRound.connect(Admin).stopBet()
    await this.squidBetSecondRound.connect(oracle).reportResult('0', '1')

    expect(await this.squidBetSecondRound.getwinners(addr1.address)).to.equal(
      true,
    )
    expect(await this.squidBetSecondRound.getwinners(addr2.address)).to.equal(
      true,
    )

    ///////// third round////
    await this.squidBetThirdRound
      .connect(addr1)
      .placeBet('0', { value: ethers.utils.parseEther('5.0') })
    await this.squidBetThirdRound
      .connect(addr2)
      .placeBet('0', { value: ethers.utils.parseEther('5.0') })

    await this.squidBetThirdRound.connect(Admin).stopBet()
    await this.squidBetThirdRound.connect(oracle).reportResult('0', '1')

    expect(await this.squidBetThirdRound.getwinners(addr1.address)).to.equal(
      true,
    )
    expect(await this.squidBetThirdRound.getwinners(addr2.address)).to.equal(
      true,
    )

    ////Forth Round////

    await this.squidBetForthRound
      .connect(addr1)
      .placeBet('0', { value: ethers.utils.parseEther('5.0') })
    await this.squidBetForthRound
      .connect(addr2)
      .placeBet('0', { value: ethers.utils.parseEther('5.0') })

    await this.squidBetForthRound.connect(Admin).stopBet()
    await this.squidBetForthRound.connect(oracle).reportResult('0', '1')

    expect(await this.squidBetForthRound.getwinners(addr1.address)).to.equal(
      true,
    )
    expect(await this.squidBetForthRound.getwinners(addr2.address)).to.equal(
      true,
    )

    await this.squidBetFinalRound
      .connect(addr1)
      .placeBet('0', { value: ethers.utils.parseEther('5.0') })
    await this.squidBetFinalRound
      .connect(addr2)
      .placeBet('0', { value: ethers.utils.parseEther('5.0') })

    await this.squidBetFinalRound.stopBet()
    await this.squidBetFinalRound.connect(oracle).reportResult(0, 1)

    await this.squidBetFinalRound.connect(addr1).Vote(1)

    currVote = await this.squidBetFinalRound.vote()
    expect(currVote).to.eq(1)

    await this.squidBetFinalRound.connect(addr2).Vote(1)

    currVote = await this.squidBetFinalRound.vote()
    expect(currVote).to.eq(2)

    await this.squidBetFinalRound.stopVote()
    await this.squidBetFinalRound.resultVote()

    const res = await this.squidBetFinalRound.finalVoteDecision()

    expect(res).to.eq(
      'Split The Prize Pool equally between every last final Players remaining in the Squid Bet Competition',
    )
  })

  it('SquidBets final round vote side 2 wins', async function () {
    let currVote = await this.squidBetFinalRound.vote()

    expect(currVote).to.eq(0)

    await this.squidBetPlayersRegistration
      .connect(addr1)
      .registerPlayer({ value: ethers.utils.parseEther('1.0') })
    await this.squidBetPlayersRegistration
      .connect(addr2)
      .registerPlayer({ value: ethers.utils.parseEther('1.0') })

    await this.squidBetStartRound
      .connect(addr1)
      .placeBet('1', { value: ethers.utils.parseEther('5.0') })
    await this.squidBetStartRound
      .connect(addr2)
      .placeBet('1', { value: ethers.utils.parseEther('5.0') })

    await this.squidBetStartRound.connect(Admin).stopBet()
    await expect(
      this.squidBetStartRound.connect(addr1).stopBet(),
    ).to.be.revertedWith('Only Admin and Owner can perform this function')

    await this.squidBetStartRound.connect(oracle).reportResult('1', '0')
    await expect(
      this.squidBetStartRound.connect(addr1).reportResult('1', '0'),
    ).to.be.revertedWith('Only Oracle and Owner can perform this function')

    expect(await this.squidBetStartRound.getwinners(addr1.address)).to.equal(
      true,
    )
    expect(await this.squidBetStartRound.getwinners(addr2.address)).to.equal(
      true,
    )

    ///second

    await this.squidBetSecondRound
      .connect(addr1)
      .placeBet('0', { value: ethers.utils.parseEther('5.0') })
    await this.squidBetSecondRound
      .connect(addr2)
      .placeBet('0', { value: ethers.utils.parseEther('5.0') })
    await expect(
      this.squidBetSecondRound
        .connect(addr5)
        .placeBet('1', { value: ethers.utils.parseEther('5.0') }),
    ).to.be.revertedWith('Not a valid player')

    await this.squidBetSecondRound.connect(Admin).stopBet()
    await this.squidBetSecondRound.connect(oracle).reportResult('0', '1')

    expect(await this.squidBetSecondRound.getwinners(addr1.address)).to.equal(
      true,
    )
    expect(await this.squidBetSecondRound.getwinners(addr2.address)).to.equal(
      true,
    )

    ///////// third round////
    await this.squidBetThirdRound
      .connect(addr1)
      .placeBet('0', { value: ethers.utils.parseEther('5.0') })
    await this.squidBetThirdRound
      .connect(addr2)
      .placeBet('0', { value: ethers.utils.parseEther('5.0') })

    await this.squidBetThirdRound.connect(Admin).stopBet()
    await this.squidBetThirdRound.connect(oracle).reportResult('0', '1')

    expect(await this.squidBetThirdRound.getwinners(addr1.address)).to.equal(
      true,
    )
    expect(await this.squidBetThirdRound.getwinners(addr2.address)).to.equal(
      true,
    )

    ////Forth Round////

    await this.squidBetForthRound
      .connect(addr1)
      .placeBet('0', { value: ethers.utils.parseEther('5.0') })
    await this.squidBetForthRound
      .connect(addr2)
      .placeBet('0', { value: ethers.utils.parseEther('5.0') })

    await this.squidBetForthRound.connect(Admin).stopBet()
    await this.squidBetForthRound.connect(oracle).reportResult('0', '1')

    expect(await this.squidBetForthRound.getwinners(addr1.address)).to.equal(
      true,
    )
    expect(await this.squidBetForthRound.getwinners(addr2.address)).to.equal(
      true,
    )

    await this.squidBetFinalRound
      .connect(addr1)
      .placeBet('0', { value: ethers.utils.parseEther('5.0') })
    await this.squidBetFinalRound
      .connect(addr2)
      .placeBet('0', { value: ethers.utils.parseEther('5.0') })

    await this.squidBetFinalRound.stopBet()
    await this.squidBetFinalRound.connect(oracle).reportResult(0, 1)

    await this.squidBetFinalRound.connect(addr1).Vote(2)

    currVote = await this.squidBetFinalRound.vote()
    expect(currVote).to.eq(-1)

    await this.squidBetFinalRound.connect(addr2).Vote(2)

    currVote = await this.squidBetFinalRound.vote()
    expect(currVote).to.eq(-2)

    await this.squidBetFinalRound.stopVote()
    await this.squidBetFinalRound.resultVote()

    const res = await this.squidBetFinalRound.finalVoteDecision()

    expect(res).to.eq(
      'Random Draw will decide the only Winner of the Squid Bet Competition',
    )
  })

  it("Non-winners can't vote final round", async function () {
    let currVote = await this.squidBetFinalRound.vote()

    expect(currVote).to.eq(0)
    await expect(
      this.squidBetFinalRound.connect(addr1).Vote(1),
    ).to.be.revertedWith('You do not have any winning bet')
  })

  it('Squidbets cancel event', async function () {
    await this.squidBetPlayersRegistration
      .connect(addr1)
      .registerPlayer({ value: ethers.utils.parseEther('1.0') })
    await this.squidBetPlayersRegistration
      .connect(addr2)
      .registerPlayer({ value: ethers.utils.parseEther('1.0') })

    await this.squidBetStartRound
      .connect(addr1)
      .placeBet('1', { value: ethers.utils.parseEther('5.0') })
    await this.squidBetStartRound
      .connect(addr2)
      .placeBet('1', { value: ethers.utils.parseEther('5.0') })

    await this.squidBetStartRound.connect(Admin).cancelEvent()

    const bal1Before = await ethers.provider.getBalance(addr1.address)

    await this.squidBetStartRound.connect(addr1).claimBetCancelledEvent()

    const bal1After = await ethers.provider.getBalance(addr2.address)

    expect(bal1Before).to.lt(bal1After)

    const bal2Before = await ethers.provider.getBalance(addr1.address)

    await this.squidBetStartRound.connect(addr2).claimBetCancelledEvent()

    const bal2After = await ethers.provider.getBalance(addr2.address)

    expect(bal2Before).to.lt(bal2After)
  })

  it("Can't claim cancelled twice", async function () {
    await this.squidBetPlayersRegistration
      .connect(addr1)
      .registerPlayer({ value: ethers.utils.parseEther('1.0') })
    await this.squidBetPlayersRegistration
      .connect(addr2)
      .registerPlayer({ value: ethers.utils.parseEther('1.0') })

    await this.squidBetStartRound
      .connect(addr1)
      .placeBet('1', { value: ethers.utils.parseEther('5.0') })
    await this.squidBetStartRound
      .connect(addr2)
      .placeBet('1', { value: ethers.utils.parseEther('5.0') })

    await this.squidBetStartRound.connect(Admin).cancelEvent()

    const bal1Before = await ethers.provider.getBalance(addr1.address)

    await this.squidBetStartRound.connect(addr1).claimBetCancelledEvent()

    const bal1After = await ethers.provider.getBalance(addr2.address)

    expect(bal1Before).to.lt(bal1After)

    await expect(
      this.squidBetStartRound.connect(addr1).claimBetCancelledEvent(),
    ).to.be.revertedWith('You do not make any bets')
  })

  it("Squidbets can't report same winner", async function () {
    await this.squidBetPlayersRegistration
      .connect(addr1)
      .registerPlayer({ value: ethers.utils.parseEther('1.0') })
    await this.squidBetPlayersRegistration
      .connect(addr2)
      .registerPlayer({ value: ethers.utils.parseEther('1.0') })

    await this.squidBetStartRound
      .connect(addr1)
      .placeBet('1', { value: ethers.utils.parseEther('5.0') })
    await this.squidBetStartRound
      .connect(addr2)
      .placeBet('1', { value: ethers.utils.parseEther('5.0') })

    await this.squidBetStartRound.connect(Admin).stopBet()
    await expect(
      this.squidBetStartRound.connect(addr1).stopBet(),
    ).to.be.revertedWith('Only Admin and Owner can perform this function')

    await expect(
      this.squidBetStartRound.connect(oracle).reportResult('1', '1'),
    ).to.be.revertedWith('Winner and loser cannot be the same')
  })

  it('Squidbets prize pool withdraw single then withdraw all', async function () {
    await this.squidBetPrizePool.addMultipleWinnersAddress([
      addr1.address,
      addr2.address,
      addr3.address,
      addr4.address,
      addr5.address,
    ])

    const balBefore1 = await ethers.provider.getBalance(addr1.address)

    await this.squidBetPrizePool.connect(addr1).winnerClaimPrizePool()

    const balAfter1 = await ethers.provider.getBalance(addr1.address)

    expect(balBefore1).to.lt(balAfter1)

    const balBefore2 = await ethers.provider.getBalance(addr2.address)
    const balBefore3 = await ethers.provider.getBalance(addr3.address)

    await this.squidBetPrizePool.winnersClaimPrizePool()

    const balAfter2 = await ethers.provider.getBalance(addr2.address)
    const balAfter3 = await ethers.provider.getBalance(addr3.address)
    const balAfterAfter1 = await ethers.provider.getBalance(addr1.address)

    expect(balBefore2).to.lt(balAfter2)
    expect(balBefore3).to.lt(balAfter3)
    expect(balAfter1).to.eq(balAfterAfter1)
  })

  it("Squidbets prize pool withdraw all then can't withdraw single", async function () {
    await this.squidBetPrizePool.addMultipleWinnersAddress([
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

    await this.squidBetPrizePool.winnersClaimPrizePool()

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
      this.squidBetPrizePool.connect(addr1).winnerClaimPrizePool(),
    ).to.be.revertedWith(
      'Only a Winner of the Squid Bet Competition can claim the Prize Pool',
    )
  })

  it("Squidbets prize pool non-winner can't withdraw", async function () {
    await this.squidBetPrizePool.addMultipleWinnersAddress([
      addr1.address,
      addr2.address,
      addr3.address,
      addr4.address,
      addr5.address,
    ])

    await expect(
      this.squidBetPrizePool.connect(addr6).winnerClaimPrizePool(),
    ).to.be.revertedWith(
      'Only a Winner of the Squid Bet Competition can claim the Prize Pool',
    )
  })

  it("Squidbets prize pool winner can't withdraw twice", async function () {
    await this.squidBetPrizePool.addMultipleWinnersAddress([
      addr1.address,
      addr2.address,
      addr3.address,
      addr4.address,
      addr5.address,
    ])

    const balBefore1 = await ethers.provider.getBalance(addr1.address)

    await this.squidBetPrizePool.connect(addr1).winnerClaimPrizePool()

    const balAfter1 = await ethers.provider.getBalance(addr1.address)

    expect(balBefore1).to.lt(balAfter1)

    await expect(
      this.squidBetPrizePool.connect(addr6).winnerClaimPrizePool(),
    ).to.be.revertedWith(
      'Only a Winner of the Squid Bet Competition can claim the Prize Pool',
    )
    await expect(
      this.squidBetPrizePool.connect(addr1).winnerClaimPrizePool(),
    ).to.be.revertedWith(
      'Only a Winner of the Squid Bet Competition can claim the Prize Pool',
    )
  })
})
