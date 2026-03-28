// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {RaylsErc721Handler} from "rayls-protocol-sdk/tokens/RaylsErc721Handler.sol";

/// @title LuxWatchNFT
/// @notice Confidential luxury watch NFT with rich private metadata.
///         Deployed on the Rayls Privacy Node — all metadata is invisible
///         until explicitly bridged or revealed.
contract LuxWatchNFT is RaylsErc721Handler {

    struct ImageCommitment {
        bytes32 imageHash;
        string imageUri;
        string imageType;
        uint256 capturedAt;
    }

    struct ServiceRecord {
        uint256 date;
        string serviceCenter;
        string workPerformed;
        uint256 cost;
    }

    struct ProvenanceEntry {
        address from;
        address to;
        uint256 timestamp;
        uint256 price;
        bytes32 previousHash;
    }

    struct WatchData {
        string brand;
        string model;
        string referenceNumber;
        uint256 yearOfProduction;
        string serialNumber;
        string movementCaliber;
        string caseMaterial;
        string dialColor;
        string braceletType;
        uint256 caseDiameterMM;
        bytes32 purchaseReceiptHash;
        uint256 appraisedValue;
        string conditionGrade;
        string conditionNotes;
        bytes32 currentProvenanceHash;
        uint8 ownerCount;
        bool isAttested;
        uint8 attestationScore;
        bool zkVerified;
    }

    mapping(uint256 => WatchData) private _watches;
    mapping(uint256 => ImageCommitment[]) private _images;
    mapping(uint256 => ServiceRecord[]) private _services;
    mapping(uint256 => ProvenanceEntry[]) private _provenance;
    mapping(uint256 => bytes32) public metadataHash;
    uint256 private _nextTokenId;

    event WatchMinted(uint256 indexed tokenId, string brand, string model, string referenceNumber, bytes32 metadataHash);
    event ImageAdded(uint256 indexed tokenId, string imageType, bytes32 imageHash);
    event ServiceAdded(uint256 indexed tokenId, uint256 date);
    event ProvenanceUpdated(uint256 indexed tokenId, bytes32 newHash, uint8 ownerCount);
    event WatchAttested(uint256 indexed tokenId, uint8 score, bool zkVerified);

    /// @param _uri             Base URI for token metadata
    /// @param _endpoint        EndpointV1 address
    /// @param _raylsNodeEndpoint RNEndpointV1 address
    /// @param _userGovernance  RNUserGovernanceV1 address
    constructor(
        string memory _uri,
        address _endpoint,
        address _raylsNodeEndpoint,
        address _userGovernance
    )
        RaylsErc721Handler(
            _uri,
            "LuxVerify Watch",
            "LUXW",
            _endpoint,
            _raylsNodeEndpoint,
            _userGovernance,
            msg.sender,
            false
        )
    {
        _nextTokenId = 1;
    }

    function mintWatch(
        string calldata brand,
        string calldata model,
        string calldata referenceNumber,
        uint256 yearOfProduction,
        string calldata serialNumber,
        string calldata movementCaliber,
        string calldata caseMaterial,
        string calldata dialColor,
        string calldata braceletType,
        uint256 caseDiameterMM,
        bytes32 purchaseReceiptHash,
        uint256 appraisedValue,
        string calldata conditionGrade,
        string calldata conditionNotes
    ) external onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId++;

        WatchData storage w = _watches[tokenId];
        w.brand = brand;
        w.model = model;
        w.referenceNumber = referenceNumber;
        w.yearOfProduction = yearOfProduction;
        w.serialNumber = serialNumber;
        w.movementCaliber = movementCaliber;
        w.caseMaterial = caseMaterial;
        w.dialColor = dialColor;
        w.braceletType = braceletType;
        w.caseDiameterMM = caseDiameterMM;
        w.purchaseReceiptHash = purchaseReceiptHash;
        w.appraisedValue = appraisedValue;
        w.conditionGrade = conditionGrade;
        w.conditionNotes = conditionNotes;
        w.ownerCount = 1;

        bytes32 provHash = keccak256(
            abi.encodePacked(bytes32(0), msg.sender, block.timestamp, appraisedValue)
        );
        w.currentProvenanceHash = provHash;
        _provenance[tokenId].push(
            ProvenanceEntry(address(0), msg.sender, block.timestamp, appraisedValue, bytes32(0))
        );

        bytes32 mHash = keccak256(
            abi.encodePacked(brand, model, referenceNumber, serialNumber, movementCaliber, yearOfProduction)
        );
        metadataHash[tokenId] = mHash;

        _safeMint(msg.sender, tokenId);

        emit WatchMinted(tokenId, brand, model, referenceNumber, mHash);
        return tokenId;
    }

    function addImage(
        uint256 tokenId,
        bytes32 imageHash,
        string calldata imageUri,
        string calldata imageType,
        uint256 capturedAt
    ) external onlyOwner {
        require(ownerOf(tokenId) != address(0), "No token");
        _images[tokenId].push(ImageCommitment(imageHash, imageUri, imageType, capturedAt));
        emit ImageAdded(tokenId, imageType, imageHash);
    }

    function addService(
        uint256 tokenId,
        uint256 date,
        string calldata center,
        string calldata work,
        uint256 cost
    ) external onlyOwner {
        require(ownerOf(tokenId) != address(0), "No token");
        _services[tokenId].push(ServiceRecord(date, center, work, cost));
        emit ServiceAdded(tokenId, date);
    }

    function recordTransfer(
        uint256 tokenId,
        address from,
        address to,
        uint256 price
    ) external onlyOwner {
        WatchData storage w = _watches[tokenId];
        bytes32 newHash = keccak256(
            abi.encodePacked(w.currentProvenanceHash, from, to, block.timestamp, price)
        );
        _provenance[tokenId].push(
            ProvenanceEntry(from, to, block.timestamp, price, w.currentProvenanceHash)
        );
        w.currentProvenanceHash = newHash;
        w.ownerCount++;
        emit ProvenanceUpdated(tokenId, newHash, w.ownerCount);
    }

    function markAttested(uint256 tokenId, uint8 score, bool zkOk) external onlyOwner {
        _watches[tokenId].isAttested = true;
        _watches[tokenId].attestationScore = score;
        _watches[tokenId].zkVerified = zkOk;
        emit WatchAttested(tokenId, score, zkOk);
    }

    function getWatchData(uint256 tokenId) external view returns (WatchData memory) {
        return _watches[tokenId];
    }

    function getImages(uint256 tokenId) external view returns (ImageCommitment[] memory) {
        return _images[tokenId];
    }

    function getServices(uint256 tokenId) external view returns (ServiceRecord[] memory) {
        return _services[tokenId];
    }

    function getProvenance(uint256 tokenId) external view returns (ProvenanceEntry[] memory) {
        return _provenance[tokenId];
    }

    function getSerialNumber(uint256 tokenId) external view returns (string memory) {
        return _watches[tokenId].serialNumber;
    }

    function getPublicSummary(uint256 tokenId) external view returns (
        string memory brand,
        string memory model,
        string memory referenceNumber,
        uint256 yearOfProduction,
        string memory caseMaterial,
        string memory conditionGrade,
        uint8 ownerCount,
        uint256 imageCount,
        uint256 serviceCount,
        bytes32 provenanceHash,
        bytes32 commitment
    ) {
        WatchData storage w = _watches[tokenId];
        return (
            w.brand, w.model, w.referenceNumber, w.yearOfProduction,
            w.caseMaterial, w.conditionGrade, w.ownerCount,
            _images[tokenId].length, _services[tokenId].length,
            w.currentProvenanceHash, metadataHash[tokenId]
        );
    }

    function getProvenanceSummary(uint256 tokenId) external view returns (
        uint8 ownerCount,
        uint256 longestHoldDays,
        uint256 averageHoldDays
    ) {
        ProvenanceEntry[] storage chain = _provenance[tokenId];
        if (chain.length <= 1) return (_watches[tokenId].ownerCount, 0, 0);

        uint256 longest = 0;
        uint256 totalDays = 0;
        for (uint256 i = 1; i < chain.length; i++) {
            uint256 holdDays = (chain[i].timestamp - chain[i - 1].timestamp) / 86400;
            if (holdDays > longest) longest = holdDays;
            totalDays += holdDays;
        }
        return (_watches[tokenId].ownerCount, longest, totalDays / (chain.length - 1));
    }
}
