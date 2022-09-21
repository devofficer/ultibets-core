// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "../utils/CustomAdmin.sol";
import "../utils/VRFv2Consumer.sol";
import "./SquidBetRound.sol";

contract SquidBet is CustomAdmin {
    /// Type declarations
    enum VoteOption {
        SplitPrizePool,
        PickRandomly
    }

    enum BetStatus {
        None,
        StartedBet,
        RegisteredPlayer,
        PassedRound,
        PlacedVote,
        PickedWinner,
        ClaimedPrize
    }

    /// Constants
    uint8 public constant CUT_FEE_PERCENT = 10;
    uint16 public constant MAX_NUMBER_OF_ROUNDS = 365;

    /// Immutable variables
    uint256 public immutable registrationFee;
    uint256 public immutable maxNumberOfPlayers;

    /// State variables
    SquidBetRound[] public rounds;
    address[] public players;
    address[] public winners;
    mapping(address => BetStatus) public playersStatus;
    mapping(address => uint256) public playersBetAmount;
    mapping(address => uint8) public roundsPassed;
    mapping(address => VoteOption) public playersVote;
    mapping(VoteOption => uint32) public votes;

    uint256 public totalCutFee;
    address public treasury;
    BetStatus public status;
    VRFv2Consumer private vrf;

    /// Events
    event VoteThrown(address player, VoteOption vote);

    /// Modifiers
    modifier onlyPassed() {
        require(playersStatus[msg.sender] == BetStatus.PassedRound, "Invalid passer");
        _;
    }

    modifier onlyWinner() {
        require(playersStatus[msg.sender] == BetStatus.PickedWinner, "Invalid winner");
        _;
    }

    /// Functions
    constructor(
        uint8 _numOfRounds,
        uint256 _registrationFee,
        uint256 _maxNumberOfPlayers,
        address _treasury,
        address _vrf
    ) {
        require(_numOfRounds > 0, "Zero number of rounds ");
        require(_numOfRounds <= MAX_NUMBER_OF_ROUNDS, "Number of rounds exceeded");

        treasury = _treasury;
        vrf = VRFv2Consumer(_vrf);
        status = BetStatus.StartedBet;
        registrationFee = _registrationFee;
        maxNumberOfPlayers = _maxNumberOfPlayers;

        SquidBetRound round;
        for (uint8 i = 0; i < _numOfRounds; i++) {
            address prevRound = (i == 0) ? address(0) : address(round);
            round = new SquidBetRound(address(this), prevRound);
            rounds.push(round);
        }
    }

    function registerPlayer() external payable {
        require(status == BetStatus.StartedBet, "Registration closed");
        require(playersStatus[msg.sender] == BetStatus.None, "Already registered");
        require(msg.value == registrationFee, "Insufficent registration fee");
        require(players.length < maxNumberOfPlayers, "Max number reached");

        uint256 cutFee = (msg.value * CUT_FEE_PERCENT) / 100;
        totalCutFee += cutFee;

        playersBetAmount[msg.sender] = msg.value;
        playersStatus[msg.sender] = BetStatus.RegisteredPlayer;
    }

    function withdrawCutFee() external onlyAdmin {
        require(status >= BetStatus.RegisteredPlayer, "Registration not closed");
        require(totalCutFee > 0, "Insufficent cut fee");

        payable(treasury).transfer(totalCutFee);
    }

    function updateVrfConsumer(address _vrf) external onlyAdmin {
        require(_vrf != address(0), "Invalid VRF consumer");

        vrf = VRFv2Consumer(_vrf);
    }

    function vote(VoteOption _vote) external onlyPassed {
        BetStatus playerStatus = playersStatus[msg.sender];
        require(status == BetStatus.PassedRound, "It is not time to vote");
        require(playerStatus == BetStatus.PassedRound, "Invalid voter");

        votes[_vote]++;
        playersVote[msg.sender] = _vote;
        playersStatus[msg.sender] = BetStatus.PlacedVote;

        emit VoteThrown(msg.sender, _vote);
    }

    function determineWinners() public onlyAdmin {
        require(status == BetStatus.PlacedVote, "Voting not closed");
        SquidBetRound finalRound = rounds[rounds.length - 1];
        uint256 winnersCount = finalRound.getWinnersCount();
        require(winnersCount > 0, "No winners exists");

        if (winnersCount == 1) {
            winners.push(finalRound.winners(0));
        } else {
            VoteOption v = getVoteResult();
            if (v == VoteOption.PickRandomly) {
                vrf.requestRandomWords();
                uint256 idx = vrf.s_randomWords(0) % winnersCount;
                winners.push(finalRound.winners(idx));
            } else if (v == VoteOption.SplitPrizePool) {
                for (uint256 i = 0; i < winnersCount; i++) {
                    winners.push(finalRound.winners(i));
                }
            }
        }

        status = BetStatus.PickedWinner;
        for (uint256 i = 0; i < winners.length; i++) {
            playersStatus[winners[i]] = BetStatus.PickedWinner;
        }
    }

    function getVoteResult() internal view returns (VoteOption) {
        uint256 maxVotes = 0;
        VoteOption voteResult = VoteOption.SplitPrizePool;

        for (
            VoteOption v = type(VoteOption).min;
            v <= type(VoteOption).max;
            v = VoteOption(uint8(v) + 1)
        ) {
            if (votes[v] > maxVotes) {
                voteResult = v;
                maxVotes = votes[v];
            }
        }

        return voteResult;
    }
}
