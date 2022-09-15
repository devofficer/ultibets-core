// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/access/Ownable.sol";

///@title This contract enables to create multiple contract administrators.
contract CustomAdmin is Ownable {
    mapping(address => bool) public admins;
    mapping(address => bool) public Oracles;

    event AdminAdded(address indexed _address);
    event AdminRemoved(address indexed _address);
    event OracleAdded(address indexed _address);
    event OracleRemoved(address indexed _address);

    ///@notice Validates if the sender is actually an administrator.
    modifier onlyAdmin() {
        require(
            admins[msg.sender] || msg.sender == owner(),
            "Only Admin and Owner can perform this function"
        );
        _;
    }

    modifier OnlyOracle() {
        require(
            Oracles[msg.sender] || msg.sender == owner(),
            "Only Oracle and Owner can perform this function"
        );
        _;
    }

    ///@notice Labels the specified address as an admin.
    ///@param _address The address to add as admin.
    function addAdmin(address _address) public onlyAdmin {
        require(_address != address(0));
        require(!admins[_address]);

        //The owner is already an admin and cannot be added.
        require(_address != owner());

        admins[_address] = true;

        emit AdminAdded(_address);
    }

    ///@notice Labels the specified address as an oracle.
    ///@param _address The address to add as oracle.
    function addOracle(address _address) public onlyAdmin {
        require(_address != address(0));
        require(!Oracles[_address]);

        //The owner is already an Oracle and cannot be added.
        require(_address != owner());

        Oracles[_address] = true;

        emit OracleAdded(_address);
    }

    ///@notice Adds multiple addresses to be admins.
    ///@param _accounts The wallet addresses to add as admins.
    function addManyAdmins(address[] memory _accounts) external onlyAdmin {
        for (uint8 i = 0; i < _accounts.length; i++) {
            address account = _accounts[i];

            ///Zero address cannot be an admin.
            ///The owner is already an admin and cannot be assigned.
            ///The address cannot be an existing admin.
            if (
                account != address(0) && !admins[account] && account != owner()
            ) {
                admins[account] = true;

                emit AdminAdded(_accounts[i]);
            }
        }
    }

    ///@notice Adds multiple addresses to be oracles.
    ///@param _accounts The wallet addresses to add as oracles.
    function addManyOracle(address[] memory _accounts) external onlyAdmin {
        for (uint8 i = 0; i < _accounts.length; i++) {
            address account = _accounts[i];

            ///Zero address cannot be an Oracle.
            ///The owner is already an admin and cannot be assigned.
            ///The address cannot be an existing Oracle.
            if (
                account != address(0) && !Oracles[account] && account != owner()
            ) {
                Oracles[account] = true;

                emit OracleAdded(_accounts[i]);
            }
        }
    }

    ///@notice Removes admin status from the specific address.
    ///@param _address The address to remove as admin.
    function removeAdmin(address _address) external onlyAdmin {
        require(_address != address(0));
        require(admins[_address]);

        //The owner cannot be removed as admin.
        require(_address != owner());

        admins[_address] = false;
        emit AdminRemoved(_address);
    }

    ///@notice Removes oracle status from the specific address.
    ///@param _address The address to remove as oracle.
    function removeOracle(address _address) external onlyAdmin {
        require(_address != address(0));
        require(Oracles[_address]);

        //The owner cannot be removed as Oracle.
        require(_address != owner());

        Oracles[_address] = false;
        emit OracleRemoved(_address);
    }

    ///@notice Removes admin status from the provided addresses.
    ///@param _accounts The addresses to remove as admin.
    function removeManyAdmins(address[] memory _accounts) external onlyAdmin {
        for (uint8 i = 0; i < _accounts.length; i++) {
            address account = _accounts[i];

            ///Zero address can neither be added or removed.
            ///The owner is the super admin and cannot be removed.
            ///The address must be an existing admin in order for it to be removed.
            if (
                account != address(0) && admins[account] && account != owner()
            ) {
                admins[account] = false;

                emit AdminRemoved(_accounts[i]);
            }
        }
    }

    ///@notice Removes oracle status from the provided addresses.
    ///@param _accounts The addresses to remove as oracle.
    function removeManyOracles(address[] memory _accounts) external onlyAdmin {
        for (uint8 i = 0; i < _accounts.length; i++) {
            address account = _accounts[i];

            ///Zero address can neither be added or removed.
            ///The address must be an existing oracle in order for it to be removed.
            if (
                account != address(0) && Oracles[account] && account != owner()
            ) {
                Oracles[account] = false;

                emit OracleRemoved(_accounts[i]);
            }
        }
    }
}
