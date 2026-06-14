// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Crucible
 * @dev Proving ground and rental marketplace for autonomous DeFi agents.
 */
contract Crucible {
    // Events
    event AgentRegistered(uint256 indexed agentId, address indexed owner, uint256 stakeAmount, string configURI);
    event ArenaPublished(uint256 indexed arenaId, address indexed creator, string configURI);
    event RunRecorded(uint256 indexed agentId, uint256 indexed arenaId, bool passed);
    event AgentSlashed(uint256 indexed agentId, uint256 amountSlashed, string reason);
    event AgentBanned(uint256 indexed agentId);

    // Structs
    struct Agent {
        address owner;
        string configURI; // Points to JSON containing the DeFi Risk Parameters
        uint256 stakeAmount;
        bool isBanned;
    }

    struct TestArena {
        address creator;
        string configURI; // Defines the market simulation (e.g., Flash Crash scenario data)
    }

    // State Variables
    address public protocolOwner;
    uint256 public nextAgentId = 1;
    uint256 public nextArenaId = 1;

    mapping(uint256 => Agent) public agents;
    mapping(uint256 => TestArena) public arenas;
    
    // agentId => arenaId => passed?
    mapping(uint256 => mapping(uint256 => bool)) public trackRecords;

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == protocolOwner, "Not protocol owner");
        _;
    }

    constructor() {
        protocolOwner = msg.sender;
    }

    /**
     * @dev Register a new agent and optionally stake ETH to back it.
     * @param configUri IPFS/HTTP URI pointing to the agent's DeFi parameters.
     */
    function registerAgent(string memory configUri) external payable returns (uint256) {
        uint256 agentId = nextAgentId++;
        
        agents[agentId] = Agent({
            owner: msg.sender,
            configURI: configUri,
            stakeAmount: msg.value,
            isBanned: false
        });

        emit AgentRegistered(agentId, msg.sender, msg.value, configUri);
        return agentId;
    }

    /**
     * @dev Publish a new Test Arena (Gauntlet) for agents to run against.
     * @param configUri IPFS/HTTP URI pointing to the scenario rules and market conditions.
     */
    function publishArena(string memory configUri) external returns (uint256) {
        uint256 arenaId = nextArenaId++;
        
        arenas[arenaId] = TestArena({
            creator: msg.sender,
            configURI: configUri
        });

        emit ArenaPublished(arenaId, msg.sender, configUri);
        return arenaId;
    }

    /**
     * @dev Record the result of an agent running a test arena.
     * For the hackathon, this is centralized (called by protocolOwner).
     * In production, this would be validated by an Oracle or ZKP.
     * @param agentId The ID of the agent tested.
     * @param arenaId The ID of the arena it ran against.
     * @param passed Whether the agent successfully passed all parameters.
     */
    function recordRun(uint256 agentId, uint256 arenaId, bool passed) external onlyOwner {
        require(agents[agentId].owner != address(0), "Agent does not exist");
        require(arenas[arenaId].creator != address(0), "Arena does not exist");

        trackRecords[agentId][arenaId] = passed;

        emit RunRecorded(agentId, arenaId, passed);
    }

    /**
     * @dev Slash an agent's stake for malicious behavior or parameter violation.
     * @param agentId The ID of the misbehaving agent.
     * @param amount The amount of stake to slash and confiscate.
     * @param reason The string reason for slashing (e.g. "Max Slippage Exceeded").
     */
    function slashAgent(uint256 agentId, uint256 amount, string memory reason) external onlyOwner {
        Agent storage agent = agents[agentId];
        require(agent.owner != address(0), "Agent does not exist");
        require(!agent.isBanned, "Agent is already banned");
        require(agent.stakeAmount >= amount, "Insufficient stake to slash");

        agent.stakeAmount -= amount;
        
        // Transfer slashed amount to the protocol (or a victim's address)
        (bool success, ) = payable(protocolOwner).call{value: amount}("");
        require(success, "Transfer failed");

        emit AgentSlashed(agentId, amount, reason);

        // Auto-ban if stake hits zero
        if (agent.stakeAmount == 0) {
            agent.isBanned = true;
            emit AgentBanned(agentId);
        }
    }

    /**
     * @dev Allow an agent owner to withdraw their stake (if not banned).
     * @param agentId The ID of the agent.
     * @param amount The amount to withdraw.
     */
    function withdrawStake(uint256 agentId, uint256 amount) external {
        Agent storage agent = agents[agentId];
        require(msg.sender == agent.owner, "Not agent owner");
        require(!agent.isBanned, "Agent is banned");
        require(agent.stakeAmount >= amount, "Insufficient stake");

        agent.stakeAmount -= amount;

        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");
    }
}
