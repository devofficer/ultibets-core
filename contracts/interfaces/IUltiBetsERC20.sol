// SPDX-License-Identifier: AGPL-3.0

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IAthleteXERC20 is IERC20 {
    function pause() external;

    function unpause() external;

    function burn(uint256 amount) external;

    function burnFrom(address account, uint256 amount) external;
}