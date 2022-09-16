const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("UltiBetsBet", async function () {
  let owner, treasury, bettor1, bettor2, bettor3;

  beforeEach(async function () {
    [owner, treasury, bettor1, bettor2, bettor3] = await ethers.getSigners();
    const UltiBetsFactory = await ethers.getContractFactory("UltiBetFactory");
    const ultiBetsFactory = await UltiBetsFactory.deploy();
    await ultiBetsFactory.deployed();
    await ultiBetsFactory.createChild(treasury.address, owner.address);
    this.ultiBetsBet = await ethers.getContractAt(
      "UltiBetsBet",
      await ultiBetsFactory.idToAddress(1)
    );
  });

  it("Verify access controls", async function () {
    await expect(this.ultiBetsBet.connect(bettor1).stopBet()).to.be.revertedWith(
      "Only Oracle and Owner can perform this function"
    );
    await this.ultiBetsBet.connect(owner).stopBet();

    await expect(this.ultiBetsBet.connect(bettor1).reportResult(0, 1)).to.be.revertedWith(
      "Only Oracle and Owner can perform this function"
    );
    await this.ultiBetsBet.connect(owner).reportResult(0, 1);

    await expect(this.ultiBetsBet.connect(bettor1).cancelEvent()).to.be.revertedWith(
      "Only Admin and Owner can perform this function"
    );
    await this.ultiBetsBet.connect(owner).cancelEvent();

    await expect(this.ultiBetsBet.connect(bettor1).withdrawEarnedFees()).to.be.revertedWith(
      "Only Admin and Owner can perform this function"
    );
    await expect(this.ultiBetsBet.connect(owner).withdrawEarnedFees()).to.be.revertedWith(
      "No fees to withdraw"
    );

    await expect(this.ultiBetsBet.connect(bettor1).EmergencySafeWithdraw()).to.be.revertedWith(
      "Only Admin and Owner can perform this function"
    );
    await this.ultiBetsBet.connect(owner).EmergencySafeWithdraw();
  });

  it("Cannot report result twice", async function () {
    await this.ultiBetsBet.connect(owner).reportResult(0, 1);
    await expect(this.ultiBetsBet.connect(owner).reportResult(0, 1)).to.be.revertedWith(
      "Result already reported!"
    );
  });

  it("Cannot report same loser and winner", async function () {
    await expect(this.ultiBetsBet.connect(owner).reportResult(0, 0)).to.be.revertedWith(
      "Winner and loser are the same!"
    );
    await expect(this.ultiBetsBet.connect(owner).reportResult(1, 1)).to.be.revertedWith(
      "Winner and loser are the same!"
    );
  });

  it("Can emergency withdraw", async function () {
    await this.ultiBetsBet.placeBet(0, ethers.utils.parseEther("1"), {
      value: ethers.utils.parseEther("1"),
    });
    expect(await ethers.provider.getBalance(this.ultiBetsBet.address)).to.eq(
      ethers.utils.parseEther("1")
    );
    const treasuryBalance = await ethers.provider.getBalance(treasury.address);
    await this.ultiBetsBet.EmergencySafeWithdraw();
    expect(await ethers.provider.getBalance(this.ultiBetsBet.address)).to.eq(0);
    expect(await ethers.provider.getBalance(treasury.address)).to.eq(
      treasuryBalance.add(ethers.utils.parseEther("1"))
    );
  });

  it("Can withdraw fees", async function () {
    await this.ultiBetsBet.placeBet(0, ethers.utils.parseEther("1"), {
      value: ethers.utils.parseEther("1"),
    });
    expect(await ethers.provider.getBalance(this.ultiBetsBet.address)).to.eq(
      ethers.utils.parseEther("1")
    );
    const treasuryBalance = await ethers.provider.getBalance(treasury.address);
    await this.ultiBetsBet.reportResult(1, 0);
    await this.ultiBetsBet.withdrawEarnedFees();
    // 98% still left in contract
    expect(await ethers.provider.getBalance(this.ultiBetsBet.address)).to.eq(
      ethers.utils.parseEther("0.98")
    );
    expect(await ethers.provider.getBalance(treasury.address)).to.eq(
      treasuryBalance.add(ethers.utils.parseEther("0.02"))
    );
  });

  it("Can place bets on both sides", async function () {
    await this.ultiBetsBet.placeBet(0, ethers.utils.parseEther("1"), {
      value: ethers.utils.parseEther("1"),
    });

    await this.ultiBetsBet.placeBet(1, ethers.utils.parseEther("2"), {
      value: ethers.utils.parseEther("2"),
    });
    expect(await this.ultiBetsBet.amountPerBettor(owner.address)).to.eq(
      ethers.utils.parseEther("3")
    );
    expect(await this.ultiBetsBet.bets(0)).to.eq(ethers.utils.parseEther("1"));
    expect(await this.ultiBetsBet.bets(1)).to.eq(ethers.utils.parseEther("2"));
  });

  it("Can withdraw gains: equal bet amts on both sides", async function () {
    // Place bets
    await this.ultiBetsBet.connect(bettor1).placeBet(0, ethers.utils.parseEther("1"), {
      value: ethers.utils.parseEther("1"),
    });
    await this.ultiBetsBet.connect(bettor2).placeBet(0, ethers.utils.parseEther("1"), {
      value: ethers.utils.parseEther("1"),
    });
    await this.ultiBetsBet.connect(bettor3).placeBet(1, ethers.utils.parseEther("2"), {
      value: ethers.utils.parseEther("2"),
    });

    // Can't withdraw gain until result has been reported and bet stopped
    await expect(this.ultiBetsBet.connect(bettor1).withdrawGain()).to.be.revertedWith(
      "Event not stopped yet"
    );
    await this.ultiBetsBet.stopBet();
    await expect(this.ultiBetsBet.connect(bettor1).withdrawGain()).to.be.revertedWith(
      "Event not finished yet"
    );
    await this.ultiBetsBet.reportResult(0, 1);

    // Should be able to withdraw even with fees withdrawn
    await this.ultiBetsBet.withdrawEarnedFees();

    // Calculate gain
    const currBal1 = await ethers.provider.getBalance(bettor1.address);
    const currBal2 = await ethers.provider.getBalance(bettor2.address);
    const betAfterFee = ethers.utils.parseEther("0.98");
    const gain = betAfterFee.mul(2);

    let tx = await this.ultiBetsBet.connect(bettor1).withdrawGain();
    let receipt = await tx.wait();
    let gasSpent = receipt.gasUsed.mul(receipt.effectiveGasPrice);

    expect(await ethers.provider.getBalance(bettor1.address)).to.eq(
      currBal1.add(gain).sub(gasSpent)
    );
    // Can't withdraw gain again
    await expect(this.ultiBetsBet.connect(bettor1).withdrawGain()).to.be.revertedWith(
      "You do not have a winning bet"
    );

    tx = await this.ultiBetsBet.connect(bettor2).withdrawGain();
    receipt = await tx.wait();
    gasSpent = receipt.gasUsed.mul(receipt.effectiveGasPrice);
    expect(await ethers.provider.getBalance(bettor2.address)).to.eq(
      currBal2.add(gain).sub(gasSpent)
    );

    // Bettor3 was entirely on losing side; will underflow since fee is non-zero but winning bet is
    await expect(this.ultiBetsBet.connect(bettor3).withdrawGain()).to.be.revertedWith("revert");
  });

  it("Can withdraw gains: diff. bet amts on both sides", async function () {
    // Place bets
    await this.ultiBetsBet.connect(bettor1).placeBet(0, ethers.utils.parseEther("3"), {
      value: ethers.utils.parseEther("3"),
    });
    await this.ultiBetsBet.connect(bettor2).placeBet(0, ethers.utils.parseEther("1"), {
      value: ethers.utils.parseEther("1"),
    });
    await this.ultiBetsBet.connect(bettor3).placeBet(1, ethers.utils.parseEther("2"), {
      value: ethers.utils.parseEther("2"),
    });

    // Can't withdraw gain until result has been reported and bet stopped
    await expect(this.ultiBetsBet.connect(bettor1).withdrawGain()).to.be.revertedWith(
      "Event not stopped yet"
    );
    await this.ultiBetsBet.stopBet();
    await expect(this.ultiBetsBet.connect(bettor1).withdrawGain()).to.be.revertedWith(
      "Event not finished yet"
    );
    await this.ultiBetsBet.reportResult(0, 1);

    // Should be able to withdraw even with fees withdrawn
    await this.ultiBetsBet.withdrawEarnedFees();

    // Calculate gain
    const currBal1 = await ethers.provider.getBalance(bettor1.address);
    const currBal2 = await ethers.provider.getBalance(bettor2.address);
    const gain1 = ethers.utils.parseEther("1.47").add(ethers.utils.parseEther("2.94"))
    const gain2 = ethers.utils.parseEther("0.49").add(ethers.utils.parseEther("0.98"))
    // Bettor1 has 3/4 of the bets and Bettor2 has 1/4
    expect(gain2.mul(3)).to.eq(gain1);

    let tx = await this.ultiBetsBet.connect(bettor1).withdrawGain();
    let receipt = await tx.wait();
    let gasSpent = receipt.gasUsed.mul(receipt.effectiveGasPrice);

    expect(await ethers.provider.getBalance(bettor1.address)).to.eq(
      currBal1.add(gain1).sub(gasSpent)
    );
    // Can't withdraw gain again
    await expect(this.ultiBetsBet.connect(bettor1).withdrawGain()).to.be.revertedWith(
      "You do not have a winning bet"
    );

    tx = await this.ultiBetsBet.connect(bettor2).withdrawGain();
    receipt = await tx.wait();
    gasSpent = receipt.gasUsed.mul(receipt.effectiveGasPrice);
    expect(await ethers.provider.getBalance(bettor2.address)).to.eq(
      currBal2.add(gain2).sub(gasSpent)
    );

    // Bettor3 was entirely on losing side; will underflow since fee is non-zero but winning bet is
    await expect(this.ultiBetsBet.connect(bettor3).withdrawGain()).to.be.revertedWith("revert");
  });

  it("Can withdraw earned fees", async function () {
    // Place bets all on 0 'Yes'
    await this.ultiBetsBet.connect(bettor1).placeBet(0, ethers.utils.parseEther("1"), {
      value: ethers.utils.parseEther("1"),
    });
    await this.ultiBetsBet.connect(bettor2).placeBet(0, ethers.utils.parseEther("1"), {
      value: ethers.utils.parseEther("1"),
    });

    // 1 'No' won
    await this.ultiBetsBet.reportResult(1, 0);

    const treasuryBalanceBefore = await ethers.provider.getBalance(treasury.address);
    await this.ultiBetsBet.withdrawEarnedFees();
    const treasuryBalanceAfter = await ethers.provider.getBalance(treasury.address);

    // 2% should have been sent to treasury
    expect(treasuryBalanceAfter.sub(treasuryBalanceBefore)).to.eq(ethers.utils.parseEther("0.04"));
  });

  it("Can have all bets on winning side", async function () {
    // Place bets all on 0 'Yes'
    await this.ultiBetsBet.connect(bettor1).placeBet(0, ethers.utils.parseEther("1"), {
      value: ethers.utils.parseEther("1"),
    });
    await this.ultiBetsBet.connect(bettor2).placeBet(0, ethers.utils.parseEther("1"), {
      value: ethers.utils.parseEther("1"),
    });

    // Can't withdraw gain until result has been reported and bet stopped
    await expect(this.ultiBetsBet.connect(bettor1).withdrawGain()).to.be.revertedWith(
      "Event not stopped yet"
    );
    await this.ultiBetsBet.stopBet();
    await expect(this.ultiBetsBet.connect(bettor1).withdrawGain()).to.be.revertedWith(
      "Event not finished yet"
    );
    // 0 'Yes' won
    await this.ultiBetsBet.reportResult(0, 1);
    // Should be able to withdraw even with fees withdrawn
    await this.ultiBetsBet.withdrawEarnedFees();

    const currBal1 = await ethers.provider.getBalance(bettor1.address);
    const currBal2 = await ethers.provider.getBalance(bettor2.address);

    let tx = await this.ultiBetsBet.connect(bettor1).withdrawGain();
    let receipt = await tx.wait();
    let gasSpent = receipt.gasUsed.mul(receipt.effectiveGasPrice);
    expect(await ethers.provider.getBalance(bettor1.address)).to.eq(
      currBal1.add(ethers.utils.parseEther("0.98").sub(gasSpent))
    );

    // Withdraw gains are simply bet - fee
    tx = await this.ultiBetsBet.connect(bettor2).withdrawGain();
    receipt = await tx.wait();
    gasSpent = receipt.gasUsed.mul(receipt.effectiveGasPrice);
    expect(await ethers.provider.getBalance(bettor2.address)).to.eq(
      currBal2.add(ethers.utils.parseEther("0.98").sub(gasSpent))
    );
  });

  it("Can have all bets on losing side", async function () {
    // Place bets all on 0 'Yes'
    await this.ultiBetsBet.connect(bettor1).placeBet(0, ethers.utils.parseEther("1"), {
      value: ethers.utils.parseEther("1"),
    });
    await this.ultiBetsBet.connect(bettor2).placeBet(0, ethers.utils.parseEther("1"), {
      value: ethers.utils.parseEther("1"),
    });

    // Can't withdraw gain until result has been reported and bet stopped
    await expect(this.ultiBetsBet.connect(bettor1).withdrawGain()).to.be.revertedWith(
      "Event not stopped yet"
    );
    await this.ultiBetsBet.stopBet();
    await expect(this.ultiBetsBet.connect(bettor1).withdrawGain()).to.be.revertedWith(
      "Event not finished yet"
    );
    // 1 'No' won
    await this.ultiBetsBet.reportResult(1, 0);
    // Should be able to withdraw even with fees withdrawn
    await this.ultiBetsBet.withdrawEarnedFees();

    // Will underflow as no bet on winning side
    await expect(this.ultiBetsBet.connect(bettor1).withdrawGain()).to.be.revertedWith("revert");
    await expect(this.ultiBetsBet.connect(bettor2).withdrawGain()).to.be.revertedWith("revert");
  });

  it("Can have most bets on losing side", async function () {
    // Place bets all on 0 'Yes'
    await this.ultiBetsBet.connect(bettor1).placeBet(0, ethers.utils.parseEther("1000"), {
      value: ethers.utils.parseEther("1000"),
    });
    await this.ultiBetsBet.connect(bettor2).placeBet(0, ethers.utils.parseEther("1000"), {
      value: ethers.utils.parseEther("1000"),
    });
    await this.ultiBetsBet.connect(bettor3).placeBet(1, ethers.utils.parseEther("1"), {
      value: ethers.utils.parseEther("1"),
    });

    // Can't withdraw gain until result has been reported and bet stopped
    await expect(this.ultiBetsBet.connect(bettor1).withdrawGain()).to.be.revertedWith(
      "Event not stopped yet"
    );
    await this.ultiBetsBet.stopBet();
    await expect(this.ultiBetsBet.connect(bettor1).withdrawGain()).to.be.revertedWith(
      "Event not finished yet"
    );
    // 1 'No' won
    await this.ultiBetsBet.reportResult(1, 0);
    // Should be able to withdraw even with fees withdrawn
    await this.ultiBetsBet.withdrawEarnedFees();

    // Will underflow as no bet on winning side
    await expect(this.ultiBetsBet.connect(bettor1).withdrawGain()).to.be.revertedWith("revert");
    await expect(this.ultiBetsBet.connect(bettor2).withdrawGain()).to.be.revertedWith("revert");

    const currBal = await ethers.provider.getBalance(bettor3.address);
    let tx = await this.ultiBetsBet.connect(bettor3).withdrawGain();
    let receipt = await tx.wait();
    let gasSpent = receipt.gasUsed.mul(receipt.effectiveGasPrice);
    expect(await ethers.provider.getBalance(bettor3.address)).to.eq(
      currBal.add(ethers.utils.parseEther("1960.98").sub(gasSpent))
    );
  });

  it("Can have most bets on winning side", async function () {
    // Place bets all on 0 'Yes'
    await this.ultiBetsBet.connect(bettor1).placeBet(0, ethers.utils.parseEther("1000"), {
      value: ethers.utils.parseEther("1000"),
    });
    await this.ultiBetsBet.connect(bettor2).placeBet(0, ethers.utils.parseEther("1000"), {
      value: ethers.utils.parseEther("1000"),
    });
    await this.ultiBetsBet.connect(bettor3).placeBet(1, ethers.utils.parseEther("1"), {
      value: ethers.utils.parseEther("1"),
    });

    // Can't withdraw gain until result has been reported and bet stopped
    await expect(this.ultiBetsBet.connect(bettor1).withdrawGain()).to.be.revertedWith(
      "Event not stopped yet"
    );
    await this.ultiBetsBet.stopBet();
    await expect(this.ultiBetsBet.connect(bettor1).withdrawGain()).to.be.revertedWith(
      "Event not finished yet"
    );

    // 0 'Yes' won
    await this.ultiBetsBet.reportResult(0, 1);
    // Should be able to withdraw even with fees withdrawn
    await this.ultiBetsBet.withdrawEarnedFees();

    // Will underflow as no bet on winning side
    await expect(this.ultiBetsBet.connect(bettor3).withdrawGain()).to.be.revertedWith("revert");

    const currBal1 = await ethers.provider.getBalance(bettor1.address);
    const currBal2 = await ethers.provider.getBalance(bettor2.address);
    let tx = await this.ultiBetsBet.connect(bettor1).withdrawGain();
    let receipt = await tx.wait();
    let gasSpent = receipt.gasUsed.mul(receipt.effectiveGasPrice);
    expect(await ethers.provider.getBalance(bettor1.address)).to.eq(
      currBal1.add(ethers.utils.parseEther("980.49").sub(gasSpent))
    );

    tx = await this.ultiBetsBet.connect(bettor2).withdrawGain();
    receipt = await tx.wait();
    gasSpent = receipt.gasUsed.mul(receipt.effectiveGasPrice);
    expect(await ethers.provider.getBalance(bettor2.address)).to.eq(
      currBal2.add(ethers.utils.parseEther("980.49").sub(gasSpent))
    );
  });

  it("Can withdraw entire bet after event cancelled", async function () {
    await expect(this.ultiBetsBet.claimBetCancelledEvent()).to.be.revertedWith(
      "Event is not cancelled"
    );

    await this.ultiBetsBet.connect(bettor1).placeBet(0, ethers.utils.parseEther("1"), {
      value: ethers.utils.parseEther("1"),
    });
    await this.ultiBetsBet.cancelEvent();

    const currBal1 = await ethers.provider.getBalance(bettor1.address);
    let tx = await this.ultiBetsBet.connect(bettor1).claimBetCancelledEvent();
    let receipt = await tx.wait();
    let gasSpent = receipt.gasUsed.mul(receipt.effectiveGasPrice);

    // Expect to get entire bet back - gas spent
    expect(await ethers.provider.getBalance(bettor1.address)).to.eq(
      currBal1.add(ethers.utils.parseEther("1")).sub(gasSpent)
    );
    // Can't claim funds again after calling once
    await expect(this.ultiBetsBet.connect(bettor1).claimBetCancelledEvent()).to.be.revertedWith(
      "You did not make any bets"
    );
  });

  it("Can't place bet if result reported", async function () {
    await this.ultiBetsBet.reportResult(0, 1);
    await expect(
      this.ultiBetsBet.connect(bettor1).placeBet(0, ethers.utils.parseEther("1"), {
        value: ethers.utils.parseEther("1"),
      })
    ).to.be.revertedWith("Event is finished");
  });

  it("Can't place bet if event stopped", async function () {
    await this.ultiBetsBet.stopBet();
    await expect(
      this.ultiBetsBet.connect(bettor1).placeBet(0, ethers.utils.parseEther("1"), {
        value: ethers.utils.parseEther("1"),
      })
    ).to.be.revertedWith("Betting is stopped");
  });

  it("Can't place bet if event cancelled", async function () {
    await this.ultiBetsBet.cancelEvent();
    await expect(
      this.ultiBetsBet.connect(bettor1).placeBet(0, ethers.utils.parseEther("1"), {
        value: ethers.utils.parseEther("1"),
      })
    ).to.be.revertedWith("Event is finished");
  });

  it("Can't withdraw cancelled after withdrawing gain", async function () {
    await expect(this.ultiBetsBet.claimBetCancelledEvent()).to.be.revertedWith(
      "Event is not cancelled"
    );

    await this.ultiBetsBet.connect(bettor1).placeBet(0, ethers.utils.parseEther("1"), {
      value: ethers.utils.parseEther("1"),
    });

    await this.ultiBetsBet.reportResult(0, 1);
    await this.ultiBetsBet.stopBet();
    await this.ultiBetsBet.connect(bettor1).withdrawGain();

    await this.ultiBetsBet.cancelEvent();
    await expect(this.ultiBetsBet.connect(bettor1).claimBetCancelledEvent()).to.be.revertedWith(
      "You did not make any bets"
    );
  });

  it("Value must match bet placed", async function () {
    await expect(this.ultiBetsBet.connect(bettor1).placeBet(0, ethers.utils.parseEther("3"), {
      value: ethers.utils.parseEther("1"),
    })).to.be.revertedWith('Amount sent does not equal amount entered');

    await expect(this.ultiBetsBet.connect(owner).placeBet(0, ethers.utils.parseEther("0"), {
      value: ethers.utils.parseEther("1"),
    })).to.be.revertedWith('Amount sent does not equal amount entered');
  });

  it("Can't place bet with 0 amount", async function () {
    await expect(this.ultiBetsBet.connect(owner).placeBet(0, ethers.utils.parseEther("0"), {
      value: ethers.utils.parseEther("0"),
    })).to.be.revertedWith("Place a bet greater than 0!");
  });

});
