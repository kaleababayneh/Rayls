// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title AIReasoningLog
/// @notice Stores full structured AI reasoning on-chain for every attestation.
///         Every rule check, LLM finding, risk flag, and score breakdown is auditable.
contract AIReasoningLog is Ownable {

    struct AIReasoning {
        uint256 tokenId;
        string[] ruleNames;
        bool[] rulePassed;
        string[] ruleReasons;
        uint8 ruleScore;
        string[] llmFindings;
        string[] riskFlags;
        uint8 llmScore;
        uint8 finalScore;
        bool passed;
        uint256 timestamp;
    }

    mapping(uint256 => AIReasoning) internal _reasonings;
    uint256[] public loggedIds;
    address public oracle;

    event ReasoningLogged(uint256 indexed tokenId, uint8 finalScore, bool passed);

    constructor(address _oracle) Ownable(msg.sender) {
        oracle = _oracle;
    }

    modifier onlyOracle() {
        require(msg.sender == oracle, "Not oracle");
        _;
    }

    function logReasoning(
        uint256 tokenId,
        string[] calldata ruleNames,
        bool[] calldata rulePassed,
        string[] calldata ruleReasons,
        uint8 ruleScore,
        string[] calldata llmFindings,
        string[] calldata riskFlags,
        uint8 llmScore,
        uint8 finalScore,
        bool passed
    ) external onlyOracle {
        _reasonings[tokenId] = AIReasoning(
            tokenId,
            ruleNames,
            rulePassed,
            ruleReasons,
            ruleScore,
            llmFindings,
            riskFlags,
            llmScore,
            finalScore,
            passed,
            block.timestamp
        );

        loggedIds.push(tokenId);
        emit ReasoningLogged(tokenId, finalScore, passed);
    }

    function getReasoning(uint256 tokenId) external view returns (AIReasoning memory) {
        return _reasonings[tokenId];
    }

    function getLogCount() external view returns (uint256) {
        return loggedIds.length;
    }

    function updateOracle(address _oracle) external onlyOwner {
        oracle = _oracle;
    }
}
