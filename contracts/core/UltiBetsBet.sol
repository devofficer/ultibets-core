// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "../utils/CustomAdmin.sol";

contract UltiBetsBet is CustomAdmin, ReentrancyGuard {
    enum Side {
        Yes,
        No
    }

    struct Result {
        Side winner;
        Side loser;
    }
    Result result;

    struct BettorBetHistory {
        uint256 lastBettingTime;
        bool paid;
    }

    mapping(Side => uint256) public bets;
    mapping(address => uint256) public amountPerBettor;
    mapping(address => mapping(Side => uint256)) public betsAmountPerBettor;
    mapping(address => BettorBetHistory) betHistory;

    uint256 public constant feePercentage = 2; /// Ultibets fee percentage
    uint256 public feeBalance; /// total balance of the  Ultibets fee
    address public immutable ultiBetsTreasury; /// address of Treasury contract

    bool public isEventStopped;
    bool public isEventFinished;
    bool public isEventCancelled;

    event BetPlaced(
        /// emitted when bet is placed
        address indexed bettor,
        Side indexed bets,
        uint256 indexed amountPerBettor
    );

    event Withdrawn(
        /// emitted when user withdraws
        address indexed bettor,
        uint256 indexed amount
    );

    event Results(Side indexed winner, Side indexed losser);

    /// @dev transferOwnership is called to trasfer ownership from factory contract address to owner address
    /// @param _ultiBetsTreasury address of the treasury contract
    /// @param _owner address of the contract admin
    constructor(address _ultiBetsTreasury, address _owner) {
        require(_ultiBetsTreasury != address(0));
        require(_owner != address(0));
        ultiBetsTreasury = _ultiBetsTreasury;
        transferOwnership(_owner);
    }

    ///@notice Balance of the contract.
    ///@return Returns the balance of the contract
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /// @notice View function that for bettors to view bets history
    /// @return   _amountOnYesSide _amountOnNoSide _lastBettingTime _paid
    function MyBetsHistory()
        public
        view
        returns (
            uint256 _amountOnYesSide,
            uint256 _amountOnNoSide,
            uint256 _lastBettingTime,
            bool _paid
        )
    {
        _amountOnYesSide = betsAmountPerBettor[msg.sender][Side.Yes];
        _amountOnNoSide = betsAmountPerBettor[msg.sender][Side.No];
        _lastBettingTime = betHistory[msg.sender].lastBettingTime;
        _paid = betHistory[msg.sender].paid;
    }

    ///@notice view function for admin to view individual bets history
    /// @param _address address of the bettor bets history to be viewed
    /// @return   _amountOnYesSide _amountOnNoSide _lastBettingTime _paid

    function BettorBetsHistory(address _address)
        external
        view
        onlyAdmin
        returns (
            uint256 _amountOnYesSide,
            uint256 _amountOnNoSide,
            uint256 _lastBettingTime,
            bool _paid
        )
    {
        _amountOnYesSide = betsAmountPerBettor[_address][Side.Yes];
        _amountOnNoSide = betsAmountPerBettor[_address][Side.No];
        _lastBettingTime = betHistory[msg.sender].lastBettingTime;
        _paid = betHistory[msg.sender].paid;
    }

    /// @notice view function to view bet results
    function viewResult() external view returns (Side _winner, Side _loss) {
        _winner = result.winner;
        _loss = result.loser;
    }

    ///@notice function for bettors to place bet.
    ///@param _side the bettor side choice 0(representing YES) and 1(representing NO).
    ///@param _amount the amount bettor wants to bet.
    function placeBet(Side _side, uint256 _amount) external payable {
        require(!isEventStopped, "Betting is stopped");
        require(!isEventFinished, "Event is finished");
        require(
            msg.value == _amount,
            "Amount sent does not equal amount entered"
        );
        require(_amount > 0, "Place a bet greater than 0!");

        uint256 betAmount = _amount;
        betsAmountPerBettor[msg.sender][_side] += betAmount;
        amountPerBettor[msg.sender] += betAmount;
        betHistory[msg.sender].lastBettingTime = block.timestamp;
        bets[_side] += betAmount; // Update total bet on this side

        emit BetPlaced(msg.sender, _side, betAmount);
    }

    ///@notice function to stop bet
    ///please note that this action can only be performed by an oracle.
    function stopBet() external OnlyOracle {
        isEventStopped = true;
    }

    ///@notice emergency function to cancel event
    ///please note that this action can only be performed by an administrator.
    function cancelEvent() external onlyAdmin {
        isEventCancelled = true;
        isEventFinished = true;
    }

    ///@notice function to withdraw bet amount when bet is stopped in emergency
    function claimBetCancelledEvent() external nonReentrant {
        require(isEventCancelled, "Event is not cancelled");
        require(amountPerBettor[msg.sender] > 0, "You did not make any bets");

        uint256 BettorBet = amountPerBettor[msg.sender];
        amountPerBettor[msg.sender] = 0;

        payable(msg.sender).transfer(BettorBet);

        betHistory[msg.sender].paid = true;
    }

    ///@notice report betting result.
    ///please note that this action can only be performed by an oracle.
    ///@param _winner The winning side of the bet ( 0 if the yes side wins 1 if the No side wins).
    ///@param _loser The losing side of the bet ( 0 if the yes side loses 1 if the No side loses).
    function reportResult(Side _winner, Side _loser) external OnlyOracle {
        require(!isEventFinished, "Result already reported!");
        require(_winner != _loser, "Winner and loser are the same!");

        result.winner = _winner;
        result.loser = _loser;

        uint256 feeBet = (address(this).balance * feePercentage) / 100;
        feeBalance += feeBet;
        isEventFinished = true;

        emit Results(result.winner, result.loser);
    }

    /// @notice function for bettors to withdraw gains
    function withdrawGain() external nonReentrant {
        uint256 BettorBet = amountPerBettor[msg.sender];
        uint256 feeBettorBet = (BettorBet * feePercentage) / 100;
        uint256 BettorBetWinner = betsAmountPerBettor[msg.sender][
            result.winner
        ] - feeBettorBet;

        require(BettorBetWinner > 0, "You do not have a winning bet");
        require(isEventStopped, "Event not stopped yet");
        require(isEventFinished, "Event not finished yet");
        require(!isEventCancelled, "Event is cancelled");

        uint256 gain = BettorBetWinner +
            (bets[result.loser] * BettorBetWinner) /
            bets[result.winner];

        betsAmountPerBettor[msg.sender][Side.Yes] = 0;
        betsAmountPerBettor[msg.sender][Side.No] = 0;
        amountPerBettor[msg.sender] = 0;

        payable(msg.sender).transfer(gain);
        betHistory[msg.sender].paid = true;

        emit Withdrawn(msg.sender, gain);
    }

    ///@notice Used to withdraw platform fee to treasury address
    ///please note that this action can only be performed by an administrator.
    function withdrawEarnedFees() external nonReentrant onlyAdmin {
        require(feeBalance > 0, "No fees to withdraw");
        address payable to = payable(ultiBetsTreasury);
        uint256 amount = feeBalance;
        feeBalance = 0;
        to.transfer(amount);
    }

    ///@notice Emergency withdrawal of funds to the treasury address
    ///please note that this action can only be performed by an administrator.
    function EmergencySafeWithdraw() external onlyAdmin {
        address payable to = payable(ultiBetsTreasury);
        to.transfer(address(this).balance);
    }
}
