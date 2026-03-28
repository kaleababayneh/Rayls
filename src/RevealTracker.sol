// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title RevealTracker
/// @notice Tracks post-purchase reveal status. After a buyer purchases an
///         attested watch on the marketplace, the oracle requests reveal
///         and then confirms it once private metadata is disclosed.
contract RevealTracker is Ownable {

    struct RevealStatus {
        uint256 tokenId;
        address buyer;
        uint256 purchasedAt;
        bool revealed;
    }

    mapping(uint256 => RevealStatus) public reveals;
    uint256[] public revealedIds;

    event RevealRequested(uint256 indexed tokenId, address buyer);
    event RevealConfirmed(uint256 indexed tokenId, address buyer);

    constructor() Ownable(msg.sender) {}

    function requestReveal(uint256 tokenId, address buyer) external onlyOwner {
        reveals[tokenId] = RevealStatus(tokenId, buyer, block.timestamp, false);
        emit RevealRequested(tokenId, buyer);
    }

    function confirmReveal(uint256 tokenId) external onlyOwner {
        require(reveals[tokenId].buyer != address(0), "No pending");
        reveals[tokenId].revealed = true;
        revealedIds.push(tokenId);
        emit RevealConfirmed(tokenId, reveals[tokenId].buyer);
    }

    function isRevealed(uint256 tokenId) external view returns (bool) {
        return reveals[tokenId].revealed;
    }

    function getBuyer(uint256 tokenId) external view returns (address) {
        return reveals[tokenId].buyer;
    }

    function getRevealedCount() external view returns (uint256) {
        return revealedIds.length;
    }
}
