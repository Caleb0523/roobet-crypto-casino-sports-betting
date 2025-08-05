// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title CoinFlip
 * @dev A simple coinflip betting contract for HOPIUMBET
 */
contract CoinFlip {
    address public owner;
    uint256 public houseEdge = 200; // 2% house edge (200 basis points)
    uint256 public minBet = 0.001 ether;
    uint256 public maxBet = 1 ether;
    
    // Events
    event CoinFlipped(
        address indexed player,
        bool choice,
        bool result,
        uint256 amount,
        bool won,
        uint256 payout
    );
    
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event HouseEdgeUpdated(uint256 oldEdge, uint256 newEdge);
    event BetLimitsUpdated(uint256 newMinBet, uint256 newMaxBet);
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier validBetAmount() {
        require(msg.value >= minBet, "Bet amount too low");
        require(msg.value <= maxBet, "Bet amount too high");
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    /**
     * @dev Flip the coin and determine winner
     * @param choice Player's choice (true = heads, false = tails)
     */
    function flipCoin(bool choice) external payable validBetAmount {
        require(address(this).balance >= msg.value * 2, "Insufficient contract balance");
        
        // Generate pseudo-random result using block properties
        // Note: This is not truly random and should not be used in production
        // For production, use Chainlink VRF or similar oracle service
        bool result = _generateRandomResult();
        
        bool won = (choice == result);
        uint256 payout = 0;
        
        if (won) {
            // Calculate payout with house edge
            uint256 winAmount = (msg.value * (10000 - houseEdge)) / 10000;
            payout = msg.value + winAmount;
            
            // Transfer winnings to player
            payable(msg.sender).transfer(payout);
        }
        // If lost, the contract keeps the bet amount
        
        emit CoinFlipped(msg.sender, choice, result, msg.value, won, payout);
    }
    
    /**
     * @dev Generate pseudo-random result
     * WARNING: This is not secure randomness and should not be used in production
     */
    function _generateRandomResult() private view returns (bool) {
        uint256 randomHash = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.difficulty,
            msg.sender,
            blockhash(block.number - 1)
        )));
        return (randomHash % 2) == 0;
    }
    
    /**
     * @dev Get contract balance
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @dev Owner can deposit funds to the contract
     */
    function deposit() external payable onlyOwner {
        // Funds are automatically added to contract balance
    }
    
    /**
     * @dev Owner can withdraw funds from the contract
     */
    function withdraw(uint256 amount) external onlyOwner {
        require(amount <= address(this).balance, "Insufficient balance");
        payable(owner).transfer(amount);
    }
    
    /**
     * @dev Emergency withdraw all funds
     */
    function emergencyWithdraw() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }
    
    /**
     * @dev Update house edge (in basis points, e.g., 200 = 2%)
     */
    function setHouseEdge(uint256 newHouseEdge) external onlyOwner {
        require(newHouseEdge <= 1000, "House edge too high"); // Max 10%
        uint256 oldEdge = houseEdge;
        houseEdge = newHouseEdge;
        emit HouseEdgeUpdated(oldEdge, newHouseEdge);
    }
    
    /**
     * @dev Update betting limits
     */
    function setBetLimits(uint256 newMinBet, uint256 newMaxBet) external onlyOwner {
        require(newMinBet > 0, "Min bet must be greater than 0");
        require(newMaxBet > newMinBet, "Max bet must be greater than min bet");
        minBet = newMinBet;
        maxBet = newMaxBet;
        emit BetLimitsUpdated(newMinBet, newMaxBet);
    }
    
    /**
     * @dev Transfer ownership
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "New owner cannot be zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
    
    /**
     * @dev Get game statistics
     */
    function getGameInfo() external view returns (
        uint256 contractBalance,
        uint256 currentMinBet,
        uint256 currentMaxBet,
        uint256 currentHouseEdge
    ) {
        return (
            address(this).balance,
            minBet,
            maxBet,
            houseEdge
        );
    }
    
    /**
     * @dev Fallback function to receive Ether
     */
    receive() external payable {
        // Allow contract to receive Ether
    }
}
