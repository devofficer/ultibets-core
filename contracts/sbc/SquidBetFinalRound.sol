// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../utils/CustomAdmin.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "../utils/VRFv2Consumer.sol";

interface ISquidBetForthRound {
    function getwinners(address _address) external view returns (bool _winners);
}

contract SquidBetFinalRound is CustomAdmin, ReentrancyGuard {
    ISquidBetForthRound private tokenContract;
    VRFv2Consumer vrf;

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
    bool isVotingClosed;
    bool isCompetitionEnded;
    bool isResultReported;
    bool isWinnerPicked;

    mapping(Side => uint256) public bets;
    mapping(address => uint256) public playersSide;
    mapping(address => uint256) public amountPerBettor;
    mapping(address => mapping(Side => uint256)) public betsAmountPerBettor;
    mapping(address => bool) public AuthorizedPlayers;
    mapping(address => bool) public hasVoted;
    mapping(address => uint256) public playersVotes;

    uint256[] public votes;
    uint256 public winnerNumber;
    address public prizePool;
    address[] public Players;
    string public finalVoteDecision;
    int256 public vote;

    constructor(
        address _prizePool,
        ISquidBetForthRound _tokenContract,
        VRFv2Consumer _vrf
    ) {
        prizePool = _prizePool;
        tokenContract = _tokenContract;
        vrf = _vrf;
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    ///@notice function to place bets
    /// @param _side will consist basically of zero and one
    function placeBet(Side _side) external payable {
        require(isEventFinished == false, "Event is finished");
        require(isEventCancelled == false, "Event has been cancelled");
        require(
            tokenContract.getwinners(msg.sender) == true,
            "this address is not registered for the Squid Bet Competition"
        );
        require(msg.value == 5 ether, "Betting amount per round costs 5 FTM");
        require(amountPerBettor[msg.sender] == 0, "Bet placed already");

        uint256 betAmount = msg.value;
        uint256 choice = uint256(_side);

        Players.push(msg.sender);
        playersSide[msg.sender] = choice;

        bets[_side] += betAmount;
        betsAmountPerBettor[msg.sender][_side] += betAmount;
        amountPerBettor[msg.sender] += betAmount;
    }

    ///@notice function to stop betting usually moments before live events starts

    function stopBet() external onlyAdmin {
        isEventFinished = true;
    }

    ///@notice function cancel event in case of emergency

    function cancelEvent() external OnlyOracle {
        isEventCancelled = true;
    }

    function claimBetCancelledEvent() external nonReentrant {
        require(isEventCancelled == true, "Event is not cancelled");
        require(amountPerBettor[msg.sender] > 0, "You do not make any bets");

        uint256 BettorBet = amountPerBettor[msg.sender];
        amountPerBettor[msg.sender] = 0;

        payable(msg.sender).transfer(BettorBet);
    }

    /// @notice function to report bet result
    /// @param _winner which is the winning side usually zero or one
    ///@param _loser which is the losing side usually zero or one

    function reportResult(Side _winner, Side _loser) external OnlyOracle {
        require(isEventFinished == true, "event must be stopped first");
        require(isResultReported == false, "result cannot be reported twice");
        require(_winner != _loser, "Winner and loser cannot be the same");

        result.winner = _winner;
        result.loser = _loser;

        isEventCancelled = false;
        isVotingClosed = false;
        isCompetitionEnded = false;
        isResultReported = true;
    }

    /// @notice function for bettors to  vote for preferred choice
    /// @param _playerVote enter 1 to equally split Prize Pool, 2 to randomly pick a sole winner

    function Vote(uint256 _playerVote) external {
        //Enter 1 to equally split Prize Pool, 2 to randomly pick a sole winner
        uint256 finalRoundWinners = betsAmountPerBettor[msg.sender][
            result.winner
        ];
        require(finalRoundWinners > 0, "You do not have any winning bet");
        require(isEventFinished == true, "Event is not finished yet");
        require(isEventCancelled == false, "Event is cancelled");
        require(isVotingClosed == false, "Voting is closed");
        require(hasVoted[msg.sender] == false, "You have already voted");
        require(_playerVote == 1 || _playerVote == 2, "Voting choice invalid");

        playersVotes[msg.sender] += _playerVote;
        votes.push(_playerVote);
        hasVoted[msg.sender] = true;
        if (_playerVote == 1) vote++;
        else vote--;
    }

    /// @notice function fo admin to close voting

    function stopVote() external onlyAdmin {
        isVotingClosed = true;
    }

    /// @notice function for admin to report voting results

    function resultVote() external onlyAdmin {
        require(isVotingClosed == true, "Voting is still open");

        if (vote > 0) {
            finalVoteDecision = "Split The Prize Pool equally between every last final Players remaining in the Squid Bet Competition";
        } else {
            finalVoteDecision = "Random Draw will decide the only Winner of the Squid Bet Competition";
        }
    }

    function pickWinner() public onlyAdmin returns (uint256) {
        require(isCompetitionEnded == false, "Competition has ended");
        require(isVotingClosed == true, "Voting is still open");
        require(isWinnerPicked == false, "Winner has already been picked");

        vrf.requestRandomWords();

        uint256 _winnerNumber = vrf.s_randomWords(0) % Players.length;
        winnerNumber = _winnerNumber;
        isWinnerPicked = true;
        isCompetitionEnded = true;

        return winnerNumber;
    }

    function transferTotalEntryFeestoPrizePool() public onlyAdmin {
        require(isEventFinished == true, "betting is still on");
        address payable to = payable(prizePool);
        to.transfer(address(this).balance);
    }
}
