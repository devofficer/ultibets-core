// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Snapshot.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MockToken is ERC20, ERC20Burnable, Ownable {
    constructor() ERC20("Mock Token", "MOCK") {
        _mint(msg.sender, 2500000 * 10**decimals());
    }

    function mint(address to, uint256 amount) public onlyOwner {
      _mint(to, amount);
    }
}
