// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../Utils/CustomAdmin.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

///@dev this interface is how registered address is inherited

interface ISquidBetThirdRound {
    /// interface of squidbets registration contract
    function getwinners(address _address) external view returns (bool _winners);
}

contract SquidBetForthRound is CustomAdmin, ReentrancyGuard {
    ISquidBetThirdRound private tokenContract;
    enum Side {
        Biden,
        Trump
    }

    struct Result {
        Side winner;
        Side loser;
    }

    Result result;

    bool isEventFinished;
    bool isEventCancelled;
    bool isResultReported;

    mapping(Side => uint256) public bets;
    mapping(address => uint256) public amountPerBettor;
    mapping(address => mapping(Side => uint256)) public betsAmountPerBettor;

    address public immutable prizePool;
    address[] public Players;

    event BetPlaced(
        address _Bettor,
        Side _side,
        uint256 _amount,
        uint256 _time
    );

    event Results(Side _winner);

    constructor(address _prizePool, ISquidBetThirdRound _tokenContract) {
        require(_prizePool != address(0), "invalid address");

        prizePool = _prizePool;
        tokenContract = _tokenContract;
    }

    /// @notice view function to check contract total balance
    /// @return contract balance
    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function getwinners(address _address) public view returns (bool _isWinner) {
        if (betsAmountPerBettor[_address][result.winner] > 0) {
            _isWinner = true;
        } else {
            _isWinner = false;
        }
    }

    ///@notice function to place bets
    /// @param _side will consist basically of zero and one

    function placeBet(Side _side) external payable {
        require(isEventFinished == false, "Event is finished");
        require(isEventCancelled == false, "Event has been cancelled");
        require(
            tokenContract.getwinners(msg.sender) == true,
            "Not a valid player"
        );
        require(msg.value == 5 ether, "Betting amount per round costs 5 FTM");
        require(
            amountPerBettor[msg.sender] == 0,
            "Bet placed already"
        );

        uint256 betAmount = msg.value;

        Players.push(msg.sender);

        betsAmountPerBettor[msg.sender][_side] += betAmount;
        amountPerBettor[msg.sender] += betAmount;

        emit BetPlaced(msg.sender, _side, msg.value, block.timestamp);
    }

    ///@notice function to stop betting usually moments before live events starts

    function stopBet() external onlyAdmin {
        isEventFinished = true;
    }

    ///@notice function cancel event in case of emergency

    function cancelEvent() external OnlyOracle {
        isEventCancelled = true;
    }

    ///@notice function to withdraw bet amount when bet is stopped in emergency
    function claimBetCancelledEvent() external nonReentrant {
        require(isEventCancelled == true, "Event is not cancelled");
        require(amountPerBettor[msg.sender] > 0, "You did not make any bets");

        uint256 BettorBet = amountPerBettor[msg.sender];
        amountPerBettor[msg.sender] = 0;

        payable(msg.sender).transfer(BettorBet);
    }

    /// @notice function to repot bet result
    /// @param _winner which is the winning side usually zero or one
    ///@param _loser which is the losing side usually zero or one

    function reportResult(Side _winner, Side _loser) external OnlyOracle {
        require(isResultReported == false, "result cannot be reported twice");
        require(isEventFinished == true, "event must be stoped first");
        require(_winner != _loser, "Winner and loser cannot be the same");

        isResultReported = true;
        result.winner = _winner;
        result.loser = _loser;

        emit Results(result.winner);
    }
}
