const { expect } = require('chai')
const { ethers } = require('hardhat')
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers')
const { getRevertMessage } = require('../../utils/helpers')

describe('UltiBetsToken contract', function () {
  async function deployTokenFixture() {
    // Get the ContractFactory and Signers here.
    const Token = await ethers.getContractFactory('UltiBetsToken')
    const [owner, addr1, addr2] = await ethers.getSigners()

    const hardhatToken = await Token.deploy()

    await hardhatToken.deployed()

    return { Token, hardhatToken, owner, addr1, addr2 }
  }

  it('Should set the right owner', async function () {
    const { hardhatToken, owner } = await loadFixture(deployTokenFixture)
    expect(await hardhatToken.owner()).to.equal(owner.address)
  })

  it('Should assign the total supply of tokens to the owner', async function () {
    const { hardhatToken, owner } = await loadFixture(deployTokenFixture)
    const ownerBalance = await hardhatToken.balanceOf(owner.address)
    expect(await hardhatToken.totalSupply()).to.equal(ownerBalance)
  })

  it('should emit Transfer events', async function () {
    const { hardhatToken, owner, addr1, addr2 } = await loadFixture(
      deployTokenFixture,
    )

    // Transfer 50 tokens from owner to addr1
    await expect(hardhatToken.transfer(addr1.address, 50))
      .to.emit(hardhatToken, 'Transfer')
      .withArgs(owner.address, addr1.address, 50)

    // Transfer 50 tokens from addr1 to addr2
    await expect(hardhatToken.connect(addr1).transfer(addr2.address, 50))
      .to.emit(hardhatToken, 'Transfer')
      .withArgs(addr1.address, addr2.address, 50)
  })

  it("Should fail if sender doesn't have enough tokens", async function () {
    const { hardhatToken, owner, addr1 } = await loadFixture(deployTokenFixture)
    const initialOwnerBalance = await hardhatToken.balanceOf(owner.address)

    // Try to send 1 token from addr1 (0 tokens) to owner (1000 tokens).
    // `require` will evaluate false and revert the transaction.
    await expect(
      hardhatToken.connect(addr1).transfer(owner.address, 1),
    ).to.be.revertedWith(
      getRevertMessage('ERC20: transfer amount exceeds balance'),
    )

    // Owner balance shouldn't have changed.
    expect(await hardhatToken.balanceOf(owner.address)).to.equal(
      initialOwnerBalance,
    )
  })
})
