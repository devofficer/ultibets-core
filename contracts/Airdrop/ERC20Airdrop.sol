// SPDX-License-Identifier: AGPL-3.0

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../interfaces/IUltiBetsToken.sol";

contract Airdrop is Ownable, ReentrancyGuard {
    address public tokenAddress;
    bytes32 private merkleRoot;
    mapping(address => bool) public airdropClaimed;

    using SafeERC20 for IUltiBetsToken;

    /**
     * @notice Emitted after a successful token claim
     * @param to recipient of claim
     * @param amount of tokens claimed
     */
    event Claim(address indexed to, uint256 amount);

    constructor(address _tokenAddress, bytes32 _merkleRoot) {
        tokenAddress = _tokenAddress;
        merkleRoot = _merkleRoot;
    }

    /**
     *@return merkleRoot return current merkleRoot
     */
    function getMerkleRoot() public view onlyOwner returns (bytes32) {
        return merkleRoot;
    }

    /**
     * @param _newMerkleRoot set markle root from markle tree
     */
    function setMerkleRoot(bytes32 _newMerkleRoot) external onlyOwner {
        require(
            _newMerkleRoot != 0x00 || _newMerkleRoot != merkleRoot,
            "Airdrop: Invalid new merkle root value!"
        );
        merkleRoot = _newMerkleRoot;
    }

    /**
     * @notice Allows claiming tokens if address is part of merkle tree
     * @param amount of tokens owed to claimee
     * @param proof merkle proof to prove address and amount are in tree
     */
    function claim(uint256 amount, bytes32[] calldata proof)
        external
        nonReentrant
    {
        require(amount > 0, "Airdrop: Amount cannot be 0!");
        // Throw if address has already claimed tokens
        require(
            !airdropClaimed[msg.sender],
            "Airdrop: Airdrop has been claimed!"
        );

        // Verify merkle proof, or revert if not in tree
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender, amount));
        bool isValidLeaf = MerkleProof.verify(proof, merkleRoot, leaf);
        require(isValidLeaf, "Airdrop: Address has no Airdrop claim!");

        // Set address to claimed
        airdropClaimed[msg.sender] = true;

        // Mint tokens to address
        IUltiBetsToken token = IUltiBetsToken(tokenAddress);
        token.safeTransfer(msg.sender, amount);

        // Emit claim event
        emit Claim(msg.sender, amount);
    }
}
