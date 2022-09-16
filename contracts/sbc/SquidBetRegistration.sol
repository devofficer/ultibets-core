// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../utils/CustomAdmin.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract SquidBetRegistration is CustomAdmin {
    using SafeMath for uint256;

    bool private isRegistrationClosed; /// check if registration is closed
    mapping(address => bool) public isPlayerRegistered;

    address public immutable prizePool; /// address of the squidBetsPrizePool contract
    address public immutable treasury; /// address of the treasury contract
    uint256 public maxNumberofPlayers = 5; /// Max number of players
    uint256 public bettingFee = 1 ether; /// betting fee par user

    uint256 public constant ORG_FEE_PERCENTAGE = 10; /// Ultibets fee percentage
    uint256 public organisatorFeeBalance;
    uint256 public totalPlayerNumber = 0; /// uint to keep track of number of registered players

    constructor(address _treasury, address _prizePool) {
        require(_treasury != address(0), "Invalid treasury");
        require(_prizePool != address(0), "Invalid prize pool");
        treasury = _treasury;
        prizePool = _prizePool;
    }

    /// @notice view function for the total number of registered players
    /// @return _count of registered players

    function getRegisterPlayerCount() public view returns (uint256 _count) {
        _count = totalPlayerNumber;
    }

    /// @notice view function to check if address is registered
    /// @return _isRegistered to be true if address is registered
    /// @param _address of which registration status is to be checked

    function getIsRegisteredPlayer(address _address)
        public
        view
        returns (bool _isRegistered)
    {
        _isRegistered = isPlayerRegistered[_address];
    }

    /// @notice function to get contact balance
    /// @return contract balance

    function getBalance() public view returns (uint256) {
        return address(this).balance - organisatorFeeBalance;
    }

    /// @notice function for bettor to place bet
    /// @dev notice that msg.seder has so send Value of 0.01 eth

    function registerPlayer() external payable {
        require(isPlayerRegistered[msg.sender] == false, "Already registered");
        require(isRegistrationClosed == false, "Registration is closed");
        require(msg.value == bettingFee, "SBC costs 0.01 FTM");
        require(totalPlayerNumber < maxNumberofPlayers, "Max number reached");

        totalPlayerNumber++;

        uint256 registrationFee = (msg.value * ORG_FEE_PERCENTAGE) / 100;
        organisatorFeeBalance += registrationFee;

        isPlayerRegistered[msg.sender] = true;
    }

    function stopRegistration() external onlyAdmin {
        isRegistrationClosed = true;
    }

    /// @notice function to update number of maximum players
    /// @param _newMaxNumberofPlayers is new number of max player.

    function updatemaxNumberofPlayers(uint256 _newMaxNumberofPlayers)
        external
        onlyAdmin
    {
        maxNumberofPlayers = _newMaxNumberofPlayers;
    }

    /// @notice function to update bettingFee
    /// @param _newBettingFee is new bettingFee .

    function updateBettingFees(uint256 _newBettingFee) external onlyAdmin {
        bettingFee = _newBettingFee;
    }

    /// @notice function to transfer Ultibets fee to treasury

    function transferOrganisatorFeetoTreasury() external onlyAdmin {
        require(isRegistrationClosed == true, "Registration is still open");

        require(organisatorFeeBalance > 0, "No fees to withdraw");

        address payable to = payable(treasury);
        uint256 amount = organisatorFeeBalance;

        organisatorFeeBalance = 0;
        to.transfer(amount);
    }

    /// @notice function to transfer bettors bet to treasury

    function transferTotalEntryFeestoPrizePool() external onlyAdmin {
        require(isRegistrationClosed == true, "Registration is still open");

        require(organisatorFeeBalance == 0, "Withdraw treasury fee first");

        address payable to = payable(prizePool);
        to.transfer(address(this).balance);
    }
}
