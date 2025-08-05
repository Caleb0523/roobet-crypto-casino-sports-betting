// Web3 and MetaMask Integration for HOPIUMBET
class Web3Integration {
    constructor() {
        this.web3 = null;
        this.account = null;
        this.chainId = null;
        this.isConnected = false;
        this.contract = null;
        
        // Supported networks
        this.networks = {
            1: { name: 'Ethereum Mainnet', currency: 'ETH', rpc: 'https://mainnet.infura.io/v3/' },
            56: { name: 'BSC Mainnet', currency: 'BNB', rpc: 'https://bsc-dataseed.binance.org/' },
            137: { name: 'Polygon Mainnet', currency: 'MATIC', rpc: 'https://polygon-rpc.com/' },
            42161: { name: 'Arbitrum One', currency: 'ETH', rpc: 'https://arb1.arbitrum.io/rpc' },
            11155111: { name: 'Sepolia Testnet', currency: 'ETH', rpc: 'https://sepolia.infura.io/v3/' }
        };
        
        // Contract addresses for different networks (placeholder addresses)
        this.contractAddresses = {
            1: '0x1234567890123456789012345678901234567890', // Ethereum
            56: '0x1234567890123456789012345678901234567890', // BSC
            137: '0x1234567890123456789012345678901234567890', // Polygon
            42161: '0x1234567890123456789012345678901234567890', // Arbitrum
            11155111: '0x1234567890123456789012345678901234567890' // Sepolia
        };
        
        this.initializeWeb3();
    }
    
    async initializeWeb3() {
        // Check if MetaMask is installed
        if (typeof window.ethereum !== 'undefined') {
            console.log('MetaMask detected!');
            this.web3 = new Web3(window.ethereum);
            
            // Listen for account changes
            window.ethereum.on('accountsChanged', (accounts) => {
                this.handleAccountsChanged(accounts);
            });
            
            // Listen for chain changes
            window.ethereum.on('chainChanged', (chainId) => {
                this.handleChainChanged(chainId);
            });
            
            // Check if already connected
            try {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (accounts.length > 0) {
                    this.account = accounts[0];
                    this.chainId = await window.ethereum.request({ method: 'eth_chainId' });
                    this.isConnected = true;
                    this.updateUI();
                }
            } catch (error) {
                console.log('Error checking existing connection:', error);
            }
        } else {
            console.log('MetaMask not detected');
            this.showMetaMaskInstallPrompt();
        }
    }
    
    async connectWallet() {
        if (!window.ethereum) {
            this.showMetaMaskInstallPrompt();
            return false;
        }
        
        try {
            // Request account access
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });
            
            this.account = accounts[0];
            this.chainId = await window.ethereum.request({ method: 'eth_chainId' });
            this.isConnected = true;
            
            console.log('Connected to:', this.account);
            console.log('Chain ID:', this.chainId);
            
            // Initialize contract
            await this.initializeContract();
            
            // Update UI
            this.updateUI();
            
            // Show success message
            this.showNotification('Wallet connected successfully!', 'success');
            
            return true;
        } catch (error) {
            console.error('Error connecting wallet:', error);
            this.showNotification('Failed to connect wallet', 'error');
            return false;
        }
    }
    
    async disconnectWallet() {
        this.account = null;
        this.chainId = null;
        this.isConnected = false;
        this.contract = null;
        
        this.updateUI();
        this.showNotification('Wallet disconnected', 'info');
    }
    
    async initializeContract() {
        if (!this.isConnected || !this.chainId) return;
        
        const chainIdDecimal = parseInt(this.chainId, 16);
        const contractAddress = this.contractAddresses[chainIdDecimal];
        
        if (!contractAddress) {
            console.log('Contract not deployed on this network');
            return;
        }
        
        // Simple coinflip contract ABI
        const contractABI = [
            {
                "inputs": [{"internalType": "bool", "name": "choice", "type": "bool"}],
                "name": "flipCoin",
                "outputs": [],
                "stateMutability": "payable",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "getBalance",
                "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "withdraw",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "anonymous": false,
                "inputs": [
                    {"indexed": true, "internalType": "address", "name": "player", "type": "address"},
                    {"indexed": false, "internalType": "bool", "name": "choice", "type": "bool"},
                    {"indexed": false, "internalType": "bool", "name": "result", "type": "bool"},
                    {"indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256"},
                    {"indexed": false, "internalType": "bool", "name": "won", "type": "bool"}
                ],
                "name": "CoinFlipped",
                "type": "event"
            }
        ];
        
        try {
            this.contract = new this.web3.eth.Contract(contractABI, contractAddress);
            console.log('Contract initialized:', contractAddress);
        } catch (error) {
            console.error('Error initializing contract:', error);
        }
    }
    
    async getWalletBalance() {
        if (!this.isConnected) return '0';
        
        try {
            const balance = await this.web3.eth.getBalance(this.account);
            return this.web3.utils.fromWei(balance, 'ether');
        } catch (error) {
            console.error('Error getting balance:', error);
            return '0';
        }
    }
    
    async flipCoinOnChain(choice, betAmount) {
        if (!this.isConnected || !this.contract) {
            throw new Error('Wallet not connected or contract not initialized');
        }
        
        try {
            const betAmountWei = this.web3.utils.toWei(betAmount.toString(), 'ether');
            const choiceBool = choice === 'heads';
            
            // Estimate gas
            const gasEstimate = await this.contract.methods.flipCoin(choiceBool).estimateGas({
                from: this.account,
                value: betAmountWei
            });
            
            // Send transaction
            const transaction = await this.contract.methods.flipCoin(choiceBool).send({
                from: this.account,
                value: betAmountWei,
                gas: Math.floor(gasEstimate * 1.2) // Add 20% buffer
            });
            
            console.log('Transaction successful:', transaction);
            
            // Parse events to get result
            const events = transaction.events;
            if (events && events.CoinFlipped) {
                const event = events.CoinFlipped;
                return {
                    success: true,
                    result: event.returnValues.result ? 'heads' : 'tails',
                    won: event.returnValues.won,
                    txHash: transaction.transactionHash
                };
            }
            
            return {
                success: true,
                txHash: transaction.transactionHash
            };
            
        } catch (error) {
            console.error('Error flipping coin on chain:', error);
            throw error;
        }
    }
    
    async switchNetwork(chainId) {
        if (!window.ethereum) return false;
        
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: `0x${chainId.toString(16)}` }]
            });
            return true;
        } catch (error) {
            console.error('Error switching network:', error);
            return false;
        }
    }
    
    handleAccountsChanged(accounts) {
        if (accounts.length === 0) {
            this.disconnectWallet();
        } else if (accounts[0] !== this.account) {
            this.account = accounts[0];
            this.updateUI();
            this.showNotification('Account changed', 'info');
        }
    }
    
    handleChainChanged(chainId) {
        this.chainId = chainId;
        this.initializeContract();
        this.updateUI();
        
        const chainIdDecimal = parseInt(chainId, 16);
        const network = this.networks[chainIdDecimal];
        const networkName = network ? network.name : 'Unknown Network';
        
        this.showNotification(`Switched to ${networkName}`, 'info');
    }
    
    updateUI() {
        // Update wallet connection button
        const connectBtn = document.getElementById('connect-wallet-btn');
        const walletInfo = document.getElementById('wallet-info');
        
        if (this.isConnected) {
            if (connectBtn) {
                connectBtn.textContent = 'Disconnect Wallet';
                connectBtn.onclick = () => this.disconnectWallet();
            }
            
            if (walletInfo) {
                const chainIdDecimal = parseInt(this.chainId, 16);
                const network = this.networks[chainIdDecimal];
                const networkName = network ? network.name : 'Unknown';
                
                walletInfo.innerHTML = `
                    <div class="wallet-connected">
                        <div class="wallet-address">
                            <span class="wallet-label">Connected:</span>
                            <span class="address">${this.formatAddress(this.account)}</span>
                        </div>
                        <div class="wallet-network">
                            <span class="network-label">Network:</span>
                            <span class="network-name">${networkName}</span>
                        </div>
                    </div>
                `;
                walletInfo.style.display = 'block';
            }
            
            // Update balance
            this.updateWalletBalance();
            
        } else {
            if (connectBtn) {
                connectBtn.textContent = 'Connect Wallet';
                connectBtn.onclick = () => this.connectWallet();
            }
            
            if (walletInfo) {
                walletInfo.style.display = 'none';
            }
        }
        
        // Update mode toggle
        this.updateModeToggle();
    }
    
    async updateWalletBalance() {
        if (!this.isConnected) return;
        
        try {
            const balance = await this.getWalletBalance();
            const balanceElement = document.getElementById('wallet-balance');
            
            if (balanceElement) {
                const chainIdDecimal = parseInt(this.chainId, 16);
                const network = this.networks[chainIdDecimal];
                const currency = network ? network.currency : 'ETH';
                
                balanceElement.innerHTML = `
                    <div class="balance-info">
                        <span class="balance-label">Wallet Balance:</span>
                        <span class="balance-amount">${parseFloat(balance).toFixed(6)} ${currency}</span>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error updating wallet balance:', error);
        }
    }
    
    updateModeToggle() {
        const modeToggle = document.getElementById('mode-toggle');
        if (modeToggle) {
            if (this.isConnected) {
                modeToggle.style.display = 'block';
            } else {
                modeToggle.style.display = 'none';
                // Switch back to demo mode if wallet disconnected
                const demoRadio = document.getElementById('demo-mode');
                if (demoRadio) demoRadio.checked = true;
            }
        }
    }
    
    formatAddress(address) {
        if (!address) return '';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }
    
    showMetaMaskInstallPrompt() {
        this.showNotification('Please install MetaMask to use Web3 features', 'warning', 5000);
    }
    
    showNotification(message, type = 'info', duration = 3000) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Auto remove after duration
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, duration);
    }
    
    // Utility functions
    isValidAddress(address) {
        return this.web3 && this.web3.utils.isAddress(address);
    }
    
    toWei(amount) {
        return this.web3.utils.toWei(amount.toString(), 'ether');
    }
    
    fromWei(amount) {
        return this.web3.utils.fromWei(amount.toString(), 'ether');
    }
}

// Initialize Web3 integration
let web3Integration;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Load Web3.js library
    const web3Script = document.createElement('script');
    web3Script.src = 'https://cdn.jsdelivr.net/npm/web3@latest/dist/web3.min.js';
    web3Script.onload = function() {
        web3Integration = new Web3Integration();
        console.log('Web3 integration initialized');

        // Add explicit event listener for Connect Wallet button
        const connectBtn = document.getElementById('connect-wallet-btn');
        if (connectBtn) {
            connectBtn.addEventListener('click', () => {
                if (web3Integration.isConnected) {
                    web3Integration.disconnectWallet();
                } else {
                    web3Integration.connectWallet();
                }
            });
        }
    };
    document.head.appendChild(web3Script);
});
