// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
import "../Utils/CustomAdmin.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract SquidBetPrizePool is CustomAdmin, ReentrancyGuard {
    address public UltiBetTreasury;
    mapping(address => bool) public isEqualWinner;
    address[] public equalWinners;
    bool public prizePoolHasBeenClaimed = false;

    constructor(address _UltiBetTreasury) {
        require(_UltiBetTreasury != address(0), " not a valid address");
        UltiBetTreasury = _UltiBetTreasury;
    }

    receive() external payable {}

    /// @notice function to add multiple addresses
    /// @param _winnersAddresses is an array of address

    function addMultipleWinnersAddress(address[] memory _winnersAddresses)
        external
        onlyAdmin
    {
      

        for (uint256 i = 0; i < _winnersAddresses.length; i++) {
           
            require(
                !isEqualWinner[_winnersAddresses[i]],
                "An address cannot be added twice"
            );

            isEqualWinner[_winnersAddresses[i]] = true;
            equalWinners.push(_winnersAddresses[i]);
        }
    }

    /// @notice function for single winner to clam prize

    function winnerClaimPrizePool() external {
        require(
            isEqualWinner[msg.sender],
            "Only a Winner of the Squid Bet Competition can claim the Prize Pool"
        );

        uint256 equalSharePrizePool = address(this).balance / equalWinners.length;
        isEqualWinner[msg.sender] = false;

        payable(msg.sender).transfer(equalSharePrizePool);
    }

    /// @dev observe that since final winner cannot been grater than 5 address loop will not run out of gas
    /// @notice function for multiple winner to clam prize
    function winnersClaimPrizePool() external nonReentrant  {
        //Only needs to be called once by any equal winner (or just any address) to distribute the share equally between every winners of the Squid Bet Competition in order to avoid multiple transactions and useless gas spent'
        //A massive congratulations to all the Winners of the Squid Bet Competition!
        require(
            prizePoolHasBeenClaimed == false,
            "Prize pool has already been claimed"
        );

        prizePoolHasBeenClaimed = true;

        uint256 equalSharePrizePool = address(this).balance /
            equalWinners.length;
        for (uint256 i = 0; i < equalWinners.length; i++) {
            if(isEqualWinner[equalWinners[i]]) {
                address payable to = payable(equalWinners[i]);
                to.transfer(equalSharePrizePool);
                isEqualWinner[equalWinners[i]] = false;
            }
        }
    }

    // @notice view function to check prize pool balance
    function getPrizePoolBalance() public view returns (uint256) {
        return address(this).balance;
    }

    /// @notice Emergency withdrawal function
    function EmergencySafeWithdraw() external  onlyAdmin {
        address payable to = payable(UltiBetTreasury);
        to.transfer(address(this).balance);
    }
}
