// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Multsig.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "../library/frequencyHelper.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract UltiBetsTreasury is MultiSigWallet, ReentrancyGuard {
    address public immutable Admin;
    //uint256 public MonthlySalary = 1000000000000000000; // 1 ETH/FTM/AVAX ETC...
    mapping(address => Allocation) internal allocations;
    /// The ERC20 contract of the coin being vested.
    ERC20 public fundingCoin;
    uint256 public totalAllocation;
    uint256 public totalWithdrawn;

    constructor(
        address[] memory _owners,
        uint256 _required,
        ERC20 _fundingCoin
    ) MultiSigWallet(_owners, _required) {
        Admin = msg.sender;
        fundingCoin = _fundingCoin;

        withdrawalFrequency = FrequencyHelper.convertFrequency(
            FrequencyHelper.Frequency.Monthly
        );
    }

    ///@dev Allocaton for each user.
    struct Allocation {
        uint256 AddedOn;
        uint256 salary;
        uint256 totalpayout;
        string description;
        bool deleted;
        uint256 payoutday;
    }

    event AllocationCreated(
        /// event emitted when salary is allocated
        address indexed _address,
        uint256 _amount,
        uint256 _AddedOn
    );

    event AllocationDeleted(
        /// event emitted when salary allocation is deleted
        address indexed _address,
        uint256 _amount
    );

    event Funded(
        /// event emitted when contract is funded with funding token
        address indexed _funder,
        uint256 _amount,
        uint256 _previousCap,
        uint256 _newCap
    );

    event Withdrawn(
        /// event emitted when salary is withdrawn
        address indexed _address,
        uint256 _amount
    );

    event SalaryChanged(
        /// event emitted when salary changes
        uint256 time,
        uint256 _newSalary,
        address user
    );

    uint256 public withdrawalFrequency; /// frequency of withdrwal (monthly)

    modifier onlyAdmin() {
        require(msg.sender == Admin, "Only Admin can call this function");
        _;
    }

    /// @notice view function to get team members details.
    /// @param _address of team member
    /// @return _AddedOn _salary_totalpayou _description _deleted _payoutday

    function getTeamDetails(address _address)
        external
        view
        returns (
            uint256 _AddedOn, /// time the allocation was created
            uint256 _salary, /// the salary amount
            uint256 _totalpayout, /// total amount of salary withdrawn
            string memory _description, /// description about the team meamber e.g role
            bool _deleted, /// bool to check if team member still has an allocation
            uint256 _payoutday /// time when user can withdraw usually a month plus _AddedOn
        )
    {
        _AddedOn = allocations[_address].AddedOn;
        _salary = allocations[_address].salary;
        _totalpayout = allocations[_address].totalpayout;
        _description = allocations[_address].description;
        _deleted = allocations[_address].deleted;
        _payoutday = allocations[_address].payoutday;
    }

    /// @notice function to fund the contract with the funding token
    /// @return true if contract was succesfully funded

    function fund() external returns (bool) {
        uint256 allowance = fundingCoin.allowance(msg.sender, address(this));
        require(allowance > 0, "Nothing to fund.");

        uint256 current = getAvailableFunds();

        require(fundingCoin.transferFrom(msg.sender, address(this), allowance));

        emit Funded(msg.sender, allowance, current, getAvailableFunds());
        return true;
    }

    ///@notice view fuction to check the contract token balance.
    ///@return balance of funding Token held by this contract.
    function getAvailableFunds() public view returns (uint256) {
        return fundingCoin.balanceOf(address(this));
    }

    /// @notice view function to get amount in contract balance that has been allocated
    /// @return amount of contract balance already allocated

    function getAmountInAllocation() public view returns (uint256) {
        return totalAllocation - totalWithdrawn;
    }

    /// @notice function to create allocation
    /// @param _description of the team member e.g role
    /// @param _salary amount of the team member
    /// @param _address of team member

    function createAllocation(
        string memory _description,
        uint256 _salary,
        address _address
    ) public onlyAdmin {
        require(_address != address(0), "Invalid address.");
        require(_salary > 0, "Invalid amount.");
        require(
            allocations[_address].AddedOn == 0,
            "address already has an allocation"
        );

        require(
            getAvailableFunds() >= getAmountInAllocation() + _salary,
            "Access is denied. Insufficient balance, Allocation cap exceeded."
        );

        uint256 _AddedOn = block.timestamp;

        allocations[_address] = Allocation({
            AddedOn: _AddedOn,
            salary: _salary,
            totalpayout: 0,
            description: _description,
            deleted: false,
            payoutday: _AddedOn + withdrawalFrequency
        });

        totalAllocation += _salary;
        emit AllocationCreated(_address, _salary, _AddedOn);
    }

    /// @notice function to delete user allocation
    /// @param _address of the team member to be deleted
    /// @return true is function call is successful

    function deleteAllocation(address _address)
        external
        onlyAdmin
        returns (bool)
    {
        require(
            allocations[_address].AddedOn > 0,
            "Access is denied. Requested address does not exist"
        );
        require(
            !allocations[_address].deleted,
            "Access is denied. Requested Allocation does not exist."
        );

        uint256 _totalpayout = allocations[_address].totalpayout;
        allocations[_address].deleted = true;
        totalAllocation -= allocations[_address].salary;

        emit AllocationDeleted(_address, _totalpayout);
        return true;
    }

    /// @notice function to change team member salary
    /// @param _address of team member
    /// @param _newSalary of team member
    /// @return true is function call is successful

    function changeSalary(address _address, uint256 _newSalary)
        external
        onlyAdmin
        returns (bool)
    {
        require(
            allocations[_address].AddedOn > 0,
            "Access is denied. Requested address does not exist"
        );
        require(_newSalary > 0, "Invalid amount.");
        require(
            !allocations[_address].deleted,
            "Access is denied. Requested address has been deleted."
        );
        require(
            getAvailableFunds() >= getAmountInAllocation() + _newSalary,
            "Access is denied. Insufficient balance, Allocation cap exceeded."
        );

        uint256 previousSalary = allocations[_address].salary;

        allocations[_address].salary = _newSalary;

        if (_newSalary < previousSalary) {
            uint256 amount = previousSalary - _newSalary;
            totalAllocation -= amount;
        } else if (_newSalary > previousSalary) {
            uint256 amount = _newSalary - previousSalary;
            totalAllocation += amount;
        }

        emit SalaryChanged(block.timestamp, _newSalary, _address);
        return true;
    }

    /// @notice function for team member to withdraw salary
    /// @return hasWithdrew if function call is successful

    function withdraw() external nonReentrant returns (bool hasWithdrew) {
        require(
            allocations[msg.sender].AddedOn > 0,
            "address has no allocation"
        );

        require(
            !allocations[msg.sender].deleted,
            "Access is denied. Requested vesting schedule does not exist."
        );
        require(
            block.timestamp >= allocations[msg.sender].payoutday,
            "You cannot withdraw before your payout day"
        );

        allocations[msg.sender].payoutday =
            block.timestamp +
            withdrawalFrequency;

        uint256 amount = allocations[msg.sender].salary;
        allocations[msg.sender].salary = 0;

        require(fundingCoin.transfer(msg.sender, amount));

        allocations[msg.sender].totalpayout += amount;
        totalWithdrawn += amount;

        emit Withdrawn(msg.sender, amount);

        return true;
    }

    receive() external payable {}
}
