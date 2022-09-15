// SPDX-License-Identifier: AGPL-3.0

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/interfaces/IERC721.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";


contract Airdrop is Ownable, ReentrancyGuard {
    address public tokenAddress;
    bytes32 private merkleRoot;
      using SafeMath for uint256;
    uint tokenId = 0;
    mapping(address => bool) public airdropClaimed;

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
     * @param proof merkle proof to prove address and tokenId are in tree
     */
    function claim(bytes32[] calldata proof)
        external
        nonReentrant
    {
       
        // Throw if address has already claimed tokens
        require(
            !airdropClaimed[msg.sender],
            "Airdrop: Airdrop has been claimed!"
        );

        tokenId = tokenId.add(1);

        // Verify merkle proof, or revert if not in tree
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender, tokenId));
        bool isValidLeaf = MerkleProof.verify(proof, merkleRoot, leaf);
        require(isValidLeaf, "Airdrop: Address has no Airdrop claim!");

        // Set address to claimed
        airdropClaimed[msg.sender] = true;

       

        // Transfer  NFT to address
        IERC721 token = IERC721(tokenAddress);
        token.transferFrom(address(this), msg.sender, tokenId);

        // Emit claim event
        emit Claim(msg.sender, tokenId);
    }
}
 