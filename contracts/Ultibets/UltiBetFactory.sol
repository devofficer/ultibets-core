// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./UltiBets.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract UltiBetFactory is Ownable {
    UltiBetsBet[] children;

    event ChildCreated(
        address childAddress,
        uint256 childID,
        uint256 dateCreated,
        address Owner
    );

    // created child event
    mapping(uint256 => address) public idToAddress;
    uint256 childID = 0;

    ///@notice Gets the bet amount for each side of child betting contract.
    ///@return Returns the balnce of the contract
    ///@param _contractId the Id of the child betting contract.
    ///@param _side Side of of betting amount bettor wants to check ( take in 1 and 0 where 1 represnets the Yes side and 0 represnt the No side).
    function getbets(uint256 _contractId, UltiBetsBet.Side _side)
        public
        view
        returns (uint256)
    {
        uint256 arrayLocation = _contractId - 1;
        return (children[arrayLocation].bets(_side));
    }

    ///@notice Amount each bettor bet.
    ///@return Returns the bet amount for bettor
    ///@param _contractId the Id of the child betting contract.
    ///@param _BettorAddress address of bettor.
    ///@param _side Side of of betting amount bettor wants to check ( take in 1 and 0 where 1 represnets the Yes side and 0 represnt the No side).
    ///Please note that this action can only be performed by an owner.
    function getBetAmountByBettors(
        uint256 _contractId,
        address _BettorAddress,
        UltiBetsBet.Side _side
    ) public view onlyOwner returns (uint256) {
        uint256 arrayLocation = _contractId - 1;
        return (
            children[arrayLocation].betsAmountPerBettor(_BettorAddress, _side)
        );
    }

    ///@notice Balance of child betting contract
    ///@return bet balances of child betting contract
    ///@param _contractId the Id of the child betting contract.
    ///Please note that this action can only be performed by an Owner.
    function getBalance(uint256 _contractId)
        public
        view
        onlyOwner
        returns (uint256)
    {
        uint256 arrayLocation = _contractId - 1;
        return (children[arrayLocation].getBalance());
    }

    ///@notice Number of child betting contract created by factory contract
    ///@return returns number of Child betting contract
    function numberOfChild() public view returns (uint256) {
        return (children.length);
    }

    ///@notice BetHistory of child betting contract
    ///@return BetHistory of child betting contract
    ///@param _contractId the Id of the child betting contract.

    function getBettorBetHistory(uint256 _contractId)
        public
        view
        returns (
            uint256,
            uint256,
            uint256,
            bool
        )
    {
        uint256 arrayLocation = _contractId - 1;
        return (children[arrayLocation].MyBetsHistory());
    }

    ///@notice Create Chlild betting contract
    ///@param _ultiBetsTreasury address of Tresuary.
    ///@param _owner address of Admin.
    ///Please note that this action can only be performed by an Owner.
    function createChild(address _ultiBetsTreasury, address _owner)
        public
        onlyOwner
    {
        require(_ultiBetsTreasury != address(0));
        require(_owner != address(0));

        UltiBetsBet child = new UltiBetsBet(_ultiBetsTreasury, _owner);
        children.push(child);
        childID += 1;
        emit ChildCreated(address(child), childID, block.timestamp, _owner);
        idToAddress[childID] = address(child);
    }
}
