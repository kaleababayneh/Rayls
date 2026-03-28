// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/// @title LuxAttestation
/// @notice Public chain attestation registry with Merkle serial verification
///         and duplicate serial detection. The AI oracle inspects watches on the
///         Privacy Node and publishes attestations here.
contract LuxAttestation is Ownable {

    struct Attestation {
        string brand;
        string model;
        string referenceNumber;
        uint256 yearOfProduction;
        string caseMaterial;
        string conditionGrade;
        uint8 ownerCount;
        uint256 longestHoldDays;
        uint256 averageHoldDays;
        uint256 imageCount;
        uint256 serviceCount;
        bytes32 metadataHash;
        bytes32 provenanceHash;
        uint8 aiScore;
        string aiSummary;
        bool serialVerified;
        uint256 attestedAt;
        bool valid;
    }

    mapping(uint256 => Attestation) public attestations;
    uint256[] public attestedIds;
    mapping(string => bytes32) public serialRegistryRoots;
    address public oracle;

    // Duplicate serial detection: serialHash → first tokenId that used it
    mapping(bytes32 => uint256) public serialHashToToken;
    // Flagged duplicates
    mapping(uint256 => bool) public flaggedDuplicate;

    event Attested(uint256 indexed tokenId, string brand, string model, uint8 score, bool serialVerified);
    event Revoked(uint256 indexed tokenId);
    event RegistryUpdated(string brand, bytes32 newRoot);
    event DuplicateDetected(uint256 indexed newTokenId, uint256 indexed originalTokenId, bytes32 serialHash);

    constructor(address _oracle) Ownable(msg.sender) {
        oracle = _oracle;
    }

    modifier onlyOracle() {
        require(msg.sender == oracle, "Not oracle");
        _;
    }

    function updateSerialRegistry(string calldata brand, bytes32 root) external onlyOwner {
        serialRegistryRoots[brand] = root;
        emit RegistryUpdated(brand, root);
    }

    function verifySerial(
        string calldata brand,
        bytes32 leaf,
        bytes32[] calldata proof
    ) public view returns (bool) {
        bytes32 root = serialRegistryRoots[brand];
        if (root == bytes32(0)) return false;
        return MerkleProof.verify(proof, root, leaf);
    }

    function attest(
        uint256 tokenId,
        string calldata brand,
        string calldata model,
        string calldata referenceNumber,
        uint256 yearOfProduction,
        string calldata caseMaterial,
        string calldata conditionGrade,
        uint8 ownerCount,
        uint256 longestHoldDays,
        uint256 averageHoldDays,
        uint256 imageCount,
        uint256 serviceCount,
        bytes32 metadataHash,
        bytes32 provenanceHash,
        uint8 aiScore,
        string calldata aiSummary,
        bytes32 serialLeaf,
        bytes32[] calldata merkleProof
    ) external onlyOracle {
        require(!attestations[tokenId].valid, "Already attested");

        bool serialOk = verifySerial(brand, serialLeaf, merkleProof);

        // Duplicate serial detection
        if (serialHashToToken[serialLeaf] != 0) {
            uint256 originalToken = serialHashToToken[serialLeaf];
            // Flag both tokens as duplicates
            flaggedDuplicate[originalToken] = true;
            flaggedDuplicate[tokenId] = true;
            // Revoke the original attestation
            if (attestations[originalToken].valid) {
                attestations[originalToken].valid = false;
                emit Revoked(originalToken);
            }
            emit DuplicateDetected(tokenId, originalToken, serialLeaf);
        }
        serialHashToToken[serialLeaf] = tokenId;

        attestations[tokenId] = Attestation(
            brand, model, referenceNumber, yearOfProduction,
            caseMaterial, conditionGrade,
            ownerCount, longestHoldDays, averageHoldDays,
            imageCount, serviceCount,
            metadataHash, provenanceHash,
            aiScore, aiSummary, serialOk,
            block.timestamp, true
        );

        attestedIds.push(tokenId);
        emit Attested(tokenId, brand, model, aiScore, serialOk);
    }

    function revoke(uint256 tokenId) external onlyOracle {
        attestations[tokenId].valid = false;
        emit Revoked(tokenId);
    }

    function isDuplicate(uint256 tokenId) external view returns (bool) {
        return flaggedDuplicate[tokenId];
    }

    function getSerialOwner(bytes32 serialHash) external view returns (uint256) {
        return serialHashToToken[serialHash];
    }

    function isValid(uint256 tokenId) external view returns (bool) {
        return attestations[tokenId].valid;
    }

    function getAttestedCount() external view returns (uint256) {
        return attestedIds.length;
    }

    function getAttestation(uint256 tokenId) external view returns (Attestation memory) {
        return attestations[tokenId];
    }

    function updateOracle(address _oracle) external onlyOwner {
        oracle = _oracle;
    }
}
