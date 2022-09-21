// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "../utils/CustomAdmin.sol";

contract SquidBetRound is CustomAdmin, ReentrancyGuard {
    address public immutable prizePool;
    address public immutable prevRound;
    address[] public winners;
    address[] public players;

    constructor(address _prizePool, address _prevRound) {
        require(_prizePool != address(0), "Invalid prize pool");
        require(_prevRound != address(0), "Invalid previous round");
        prizePool = _prizePool;
        prevRound = _prevRound;
    }

    function getWinnersCount() public view returns (uint256) {
        return winners.length;
    }
}
