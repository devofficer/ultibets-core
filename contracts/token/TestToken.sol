// SPDX-License-Identifier: AGPL-3.0

pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestToken is ERC20 {
    constructor(string memory name_, string memory symbol_)
        ERC20(name_, symbol_)
    {
        _mint(msg.sender, 1000000 ether);
    }

    function mint(address account, uint256 amount) external {
        _mint(account, amount);
    }
}
