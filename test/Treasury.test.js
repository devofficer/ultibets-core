const { expect } = require("chai");
const { ethers, network } = require("hardhat");
const EVMRevert = require("../utils/EVMRevert").EVMRevert;

describe("Treasury", async function () {
  let deployer, user1, user2;

  beforeEach(async function () {
    [admin, user1, user2] = await ethers.getSigners();

    const TokenFactory = await ethers.getContractFactory("TestToken");
    this.token = await TokenFactory.deploy("GA", "GA");
    const TreasuryFactory = await ethers.getContractFactory("UltibetsTreasury");
    this.treasury = await TreasuryFactory.deploy([admin.address], 1, this.token.address);
    await this.treasury.deployed();
  });

  it("Treasury can receive ETH", async function () {
    await admin.sendTransaction({
      to: this.treasury.address,
      value: ethers.utils.parseEther("1"), // Send 1 ether
    });
    expect(await ethers.provider.getBalance(this.treasury.address)).to.eq(
      ethers.utils.parseEther("1")
    );
  });

  it("Can create allocation", async function () {
    // Verify access controls
    await expect(
      this.treasury
        .connect(user1)
        .createAllocation("test alloc", ethers.utils.parseEther("1"), user1.address)
    ).to.be.revertedWith("Only Admin can call this function");

    // Not enough funding coin in contract
    await expect(
      this.treasury.createAllocation("test alloc", ethers.utils.parseEther("1"), user1.address)
    ).to.be.revertedWith("Access is denied. Insufficient balance, Allocation cap exceeded.");

    // Fund the contract and create the allocation
    await this.token.approve(this.treasury.address, ethers.utils.parseEther("100"));
    await this.treasury.fund();
    await this.treasury.createAllocation(
      "test alloc",
      ethers.utils.parseEther("99"),
      user1.address
    );
    // Total allocation should now be increased
    expect(await this.treasury.totalAllocation()).to.eq(ethers.utils.parseEther("99"));

    // Can't add another allocation for the address
    await expect(
      this.treasury.createAllocation("test alloc", ethers.utils.parseEther("1"), user1.address)
    ).to.be.revertedWith("address already has an allocation");
    // Can't exceed allocation cap
    await expect(
      this.treasury.createAllocation("test alloc", ethers.utils.parseEther("2"), user2.address)
    ).to.be.revertedWith("Access is denied. Insufficient balance, Allocation cap exceeded.");

    await this.treasury.createAllocation("test alloc", ethers.utils.parseEther("1"), user2.address);
    // Total allocation should now be increased to 100
    expect(await this.treasury.totalAllocation()).to.eq(ethers.utils.parseEther("100"));
  });

  it("Can delete allocation", async function () {
    // Verify access controls
    await expect(this.treasury.connect(user1).deleteAllocation(user1.address)).to.be.revertedWith(
      "Only Admin can call this function"
    );

    // Fund the contract and create the allocation
    await this.token.approve(this.treasury.address, ethers.utils.parseEther("100"));
    await this.treasury.fund();
    await this.treasury.createAllocation(
      "test alloc",
      ethers.utils.parseEther("100"),
      user1.address
    );
    // Total allocation should now be increased
    expect(await this.treasury.totalAllocation()).to.eq(ethers.utils.parseEther("100"));

    await this.treasury.deleteAllocation(user1.address);
    // Total allocation should be decreased
    expect(await this.treasury.totalAllocation()).to.eq(ethers.utils.parseEther("0"));
    expect((await this.treasury.getTeamDetails(user1.address))._deleted).to.be.true;

    // Can't deleted an already deleted allocation
    await expect(this.treasury.deleteAllocation(user1.address)).to.be.revertedWith(
      "Access is denied. Requested Allocation does not exist."
    );
    // Can't delete a non-existing allocation
    await expect(this.treasury.deleteAllocation(user2.address)).to.be.revertedWith(
      "Access is denied. Requested address does not exist"
    );
  });

  it("Can change salary", async function () {
    // Verify access controls
    await expect(
      this.treasury.connect(user1).changeSalary(user1.address, ethers.utils.parseEther("2"))
    ).to.be.revertedWith("Only Admin can call this function");

    await this.token.approve(this.treasury.address, ethers.utils.parseEther("100"));
    await this.treasury.fund();
    await this.treasury.createAllocation(
      "test alloc",
      ethers.utils.parseEther("99"),
      user1.address
    );
    expect(await this.treasury.totalAllocation()).to.eq(ethers.utils.parseEther("99"));

    // Fails as available funds would be exceeded
    await expect(
      this.treasury.changeSalary(user1.address, ethers.utils.parseEther("2"))
    ).to.be.revertedWith("Access is denied. Insufficient balance, Allocation cap exceeded.");
    expect(await this.treasury.totalAllocation()).to.eq(ethers.utils.parseEther("99"));

    // Decrease salary
    await this.treasury.changeSalary(user1.address, ethers.utils.parseEther("1"));
    expect(await this.treasury.totalAllocation()).to.eq(ethers.utils.parseEther("1"));
  });

  it("Can withdraw allocation", async function () {
    // No allocation yet for address
    await expect(this.treasury.connect(user1).withdraw()).to.be.revertedWith(
      "address has no allocation"
    );

    // Fund and allocate
    await this.token.approve(this.treasury.address, ethers.utils.parseEther("100"));
    await this.treasury.fund();
    await this.treasury.createAllocation(
      "test alloc",
      ethers.utils.parseEther("100"),
      user1.address
    );

    // Payout day not reached yet
    await expect(this.treasury.connect(user1).withdraw()).to.be.revertedWith(
      "You cannot withdraw before your payout day"
    );

    // Move 1 month into the future
    await network.provider.send("evm_increaseTime", [3600 * 24 * 30]);
    await network.provider.send("evm_mine");
    // Withdraw payout
    await this.treasury.connect(user1).withdraw();
    expect(await this.token.balanceOf(this.treasury.address)).to.eq(0);
    expect(await this.token.balanceOf(user1.address)).to.eq(ethers.utils.parseEther("100"));
    expect(await this.treasury.totalWithdrawn()).to.eq(ethers.utils.parseEther("100"));

    const teamDetails = await this.treasury.getTeamDetails(user1.address);
    expect(teamDetails._deleted).to.be.false;
    expect(teamDetails._salary).to.eq(0);
    expect(teamDetails._totalpayout).to.eq(ethers.utils.parseEther("100"));
  });
});
