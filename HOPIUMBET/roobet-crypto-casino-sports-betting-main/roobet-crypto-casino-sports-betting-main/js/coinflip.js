// Coinflip Game Logic
class CoinflipGame {
    constructor() {
        this.gameState = {
            isPlaying: false,
            selectedChoice: null,
            selectedCrypto: 'BTC',
            betAmount: 0.001,
            gameResult: null,
            isFlipping: false
        };
        
        // Demo balances for each cryptocurrency
        this.balances = {
            BTC: 1.0,
            USDT: 10000,
            USDC: 10000,
            ETH: 10.0,
            SOL: 500,
            XRP: 50000,
            TRX: 100000,
            LTC: 50,
            DOGE: 100000,
            CASH: 10000
        };
        
        this.initializeGame();
    }
    
    initializeGame() {
        this.setupEventListeners();
        this.updateCryptoSymbol();
        this.updateBalance();
        this.initializeSounds();
    }
    
    setupEventListeners() {
        // Crypto selector
        const cryptoSelect = document.getElementById('crypto-select');
        if (cryptoSelect) {
            cryptoSelect.addEventListener('change', (e) => {
                this.gameState.selectedCrypto = e.target.value;
                this.updateCryptoSymbol();
                this.updateBalance();
            });
        }
        
        // Bet amount input
        const betAmountInput = document.getElementById('bet-amount');
        if (betAmountInput) {
            betAmountInput.addEventListener('input', (e) => {
                this.gameState.betAmount = parseFloat(e.target.value) || 0;
                this.validateBetAmount();
            });
        }
        
        // Choice buttons
        const choiceButtons = document.querySelectorAll('.choice-btn');
        choiceButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                this.selectChoice(e.target.dataset.choice);
            });
        });
        
        // Flip button
        const flipButton = document.getElementById('flip-button');
        if (flipButton) {
            flipButton.addEventListener('click', () => {
                this.flipCoin();
            });
        }
    }
    
    updateCryptoSymbol() {
        const cryptoSymbol = document.getElementById('selected-crypto-symbol');
        if (cryptoSymbol) {
            cryptoSymbol.textContent = this.gameState.selectedCrypto;
        }
    }
    
    updateBalance() {
        // Create or update balance display
        let balanceDisplay = document.getElementById('balance-display');
        if (!balanceDisplay) {
            balanceDisplay = document.createElement('div');
            balanceDisplay.id = 'balance-display';
            balanceDisplay.className = 'balance-display';
            
            const bettingInterface = document.querySelector('.betting-interface');
            if (bettingInterface) {
                bettingInterface.insertBefore(balanceDisplay, bettingInterface.firstChild);
            }
        }
        
        const balance = this.balances[this.gameState.selectedCrypto];
        balanceDisplay.innerHTML = `
            <div class="balance-info">
                <label>Demo Balance:</label>
                <span class="balance-amount">${balance.toFixed(8)} ${this.gameState.selectedCrypto}</span>
            </div>
        `;
    }
    
    selectChoice(choice) {
        if (this.gameState.isFlipping) return;
        
        this.gameState.selectedChoice = choice;
        
        // Update button states
        const choiceButtons = document.querySelectorAll('.choice-btn');
        choiceButtons.forEach(button => {
            button.classList.remove('active');
            if (button.dataset.choice === choice) {
                button.classList.add('active');
            }
        });
        
        this.updateFlipButtonState();
    }
    
    validateBetAmount() {
        const betAmount = this.gameState.betAmount;
        const balance = this.balances[this.gameState.selectedCrypto];
        const flipButton = document.getElementById('flip-button');
        
        if (betAmount <= 0 || betAmount > balance) {
            if (flipButton) {
                flipButton.disabled = true;
                flipButton.textContent = betAmount > balance ? 'Insufficient Balance' : 'Invalid Amount';
            }
            return false;
        }
        
        this.updateFlipButtonState();
        return true;
    }
    
    updateFlipButtonState() {
        const flipButton = document.getElementById('flip-button');
        if (!flipButton) return;
        
        const canPlay = this.gameState.selectedChoice && 
                       this.gameState.betAmount > 0 && 
                       this.gameState.betAmount <= this.balances[this.gameState.selectedCrypto] &&
                       !this.gameState.isFlipping;
        
        flipButton.disabled = !canPlay;
        flipButton.textContent = canPlay ? 'Flip Coin' : 'Select Choice & Amount';
    }
    
    async flipCoin() {
        if (this.gameState.isFlipping || !this.validateBetAmount() || !this.gameState.selectedChoice) {
            return;
        }
        
        // Check if we're in blockchain mode
        const isBlockchainMode = document.getElementById('blockchain-mode')?.checked;
        
        if (isBlockchainMode) {
            await this.flipCoinBlockchain();
        } else {
            await this.flipCoinDemo();
        }
    }
    
    async flipCoinDemo() {
        this.gameState.isFlipping = true;
        const flipButton = document.getElementById('flip-button');
        const coin = document.getElementById('coin');
        const gameResult = document.getElementById('game-result');
        
        // Hide previous results
        if (gameResult) {
            gameResult.style.display = 'none';
        }
        
        // Disable flip button
        if (flipButton) {
            flipButton.disabled = true;
            flipButton.textContent = 'Flipping...';
        }
        
        // Add flipping animation
        if (coin) {
            coin.classList.add('flipping');
        }
        
        // Play spinning sound
        this.playSound('spin');
        
        // Generate random result
        const result = Math.random() < 0.5 ? 'heads' : 'tails';
        this.gameState.gameResult = result;
        
        // Wait for 5 seconds of animation
        await this.sleep(5000);
        
        // Stop spinning sound
        this.stopSound('spin');
        
        // Show result
        this.showResult(result);
        
        // Update balance
        this.updateBalanceAfterGame(result);
        
        // Reset game state
        this.gameState.isFlipping = false;
        
        // Remove flipping animation
        if (coin) {
            coin.classList.remove('flipping');
            // Set final coin position based on result
            if (result === 'heads') {
                coin.style.transform = 'rotateY(0deg)';
            } else {
                coin.style.transform = 'rotateY(180deg)';
            }
        }
        
        // Play result sound
        const isWin = result === this.gameState.selectedChoice;
        this.playSound(isWin ? 'win' : 'lose');
        
        // Update flip button
        if (flipButton) {
            flipButton.textContent = 'Flip Again';
            flipButton.disabled = false;
        }
    }
    
    async flipCoinBlockchain() {
        if (!web3Integration || !web3Integration.isConnected) {
            this.showNotification('Please connect your wallet first', 'error');
            return;
        }
        
        this.gameState.isFlipping = true;
        const flipButton = document.getElementById('flip-button');
        const coin = document.getElementById('coin');
        const gameResult = document.getElementById('game-result');
        
        try {
            // Hide previous results
            if (gameResult) {
                gameResult.style.display = 'none';
            }
            
            // Disable flip button
            if (flipButton) {
                flipButton.disabled = true;
                flipButton.textContent = 'Confirming Transaction...';
            }
            
            // Show transaction pending notification
            this.showNotification('Please confirm the transaction in your wallet', 'info', 10000);
            
            // Execute blockchain transaction
            const txResult = await web3Integration.flipCoinOnChain(
                this.gameState.selectedChoice,
                this.gameState.betAmount
            );
            
            // Update button text
            if (flipButton) {
                flipButton.textContent = 'Flipping...';
            }
            
            // Add flipping animation
            if (coin) {
                coin.classList.add('flipping');
            }
            
            // Play spinning sound
            this.playSound('spin');
            
            // Show transaction success
            this.showNotification(`Transaction confirmed! Hash: ${txResult.txHash.slice(0, 10)}...`, 'success');
            
            // Wait for 5 seconds of animation
            await this.sleep(5000);
            
            // Stop spinning sound
            this.stopSound('spin');
            
            // Use blockchain result if available, otherwise generate random
            const result = txResult.result || (Math.random() < 0.5 ? 'heads' : 'tails');
            this.gameState.gameResult = result;
            
            // Show result
            this.showBlockchainResult(result, txResult);
            
            // Update wallet balance
            if (web3Integration) {
                web3Integration.updateWalletBalance();
            }
            
            // Remove flipping animation
            if (coin) {
                coin.classList.remove('flipping');
                // Set final coin position based on result
                if (result === 'heads') {
                    coin.style.transform = 'rotateY(0deg)';
                } else {
                    coin.style.transform = 'rotateY(180deg)';
                }
            }
            
            // Play result sound
            const isWin = result === this.gameState.selectedChoice;
            this.playSound(isWin ? 'win' : 'lose');
            
        } catch (error) {
            console.error('Blockchain flip error:', error);
            this.showNotification('Transaction failed: ' + error.message, 'error');
            
            // Remove flipping animation
            if (coin) {
                coin.classList.remove('flipping');
            }
            
            // Stop spinning sound
            this.stopSound('spin');
        } finally {
            // Reset game state
            this.gameState.isFlipping = false;
            
            // Update flip button
            if (flipButton) {
                flipButton.textContent = 'Flip Again';
                flipButton.disabled = false;
            }
        }
    }
    
    showResult(result) {
        const gameResult = document.getElementById('game-result');
        const resultTitle = document.getElementById('result-title');
        const resultText = document.getElementById('result-text');
        
        if (!gameResult || !resultTitle || !resultText) return;
        
        const isWin = result === this.gameState.selectedChoice;
        const betAmount = this.gameState.betAmount;
        const crypto = this.gameState.selectedCrypto;
        
        resultTitle.textContent = isWin ? '🎉 You Won!' : '😔 You Lost!';
        resultTitle.className = isWin ? 'win-result' : 'lose-result';
        
        if (isWin) {
            resultText.innerHTML = `
                <p>The coin landed on <strong>${result.toUpperCase()}</strong>!</p>
                <p>You won <strong>${betAmount.toFixed(8)} ${crypto}</strong>!</p>
                <p>Your new balance: <strong>${this.balances[crypto].toFixed(8)} ${crypto}</strong></p>
            `;
            resultText.className = 'win-result';
        } else {
            resultText.innerHTML = `
                <p>The coin landed on <strong>${result.toUpperCase()}</strong>!</p>
                <p>You lost <strong>${betAmount.toFixed(8)} ${crypto}</strong>.</p>
                <p>Your new balance: <strong>${this.balances[crypto].toFixed(8)} ${crypto}</strong></p>
            `;
            resultText.className = 'lose-result';
        }
        
        gameResult.style.display = 'block';
        
        // Scroll to result
        gameResult.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    updateBalanceAfterGame(result) {
        const isWin = result === this.gameState.selectedChoice;
        const betAmount = this.gameState.betAmount;
        const crypto = this.gameState.selectedCrypto;
        
        if (isWin) {
            // Win: add bet amount (2x payout - original bet)
            this.balances[crypto] += betAmount;
        } else {
            // Lose: subtract bet amount
            this.balances[crypto] -= betAmount;
        }
        
        // Ensure balance doesn't go negative
        if (this.balances[crypto] < 0) {
            this.balances[crypto] = 0;
        }
        
        this.updateBalance();
        this.validateBetAmount();
    }
    
    resetGame() {
        // Reset game state
        this.gameState.selectedChoice = null;
        this.gameState.gameResult = null;
        
        // Reset UI
        const choiceButtons = document.querySelectorAll('.choice-btn');
        choiceButtons.forEach(button => {
            button.classList.remove('active');
        });
        
        const gameResult = document.getElementById('game-result');
        if (gameResult) {
            gameResult.style.display = 'none';
        }
        
        const coin = document.getElementById('coin');
        if (coin) {
            coin.style.transform = 'rotateY(0deg)';
        }
        
        const flipButton = document.getElementById('flip-button');
        if (flipButton) {
            flipButton.textContent = 'Flip Coin';
        }
        
        this.updateFlipButtonState();
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // Enhanced Sound management system
    initializeSounds() {
        this.audioContext = null;
        this.spinOscillator = null;
        this.spinGainNode = null;
        this.isSpinSoundPlaying = false;
        
        // Initialize audio context
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('Audio system initialized successfully');
        } catch (error) {
            console.log('Audio not supported:', error);
        }
        
        // Enable audio on first user interaction
        this.enableAudioOnInteraction();
    }
    
    enableAudioOnInteraction() {
        const enableAudio = () => {
            if (this.audioContext && this.audioContext.state === 'suspended') {
                this.audioContext.resume().then(() => {
                    console.log('Audio context resumed');
                });
            }
            // Remove listeners after first interaction
            document.removeEventListener('click', enableAudio);
            document.removeEventListener('touchstart', enableAudio);
        };
        
        document.addEventListener('click', enableAudio);
        document.addEventListener('touchstart', enableAudio);
    }
    
    createOscillator(frequency, type = 'sine') {
        if (!this.audioContext) return null;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        oscillator.type = type;
        
        return { oscillator, gainNode };
    }
    
    playSpinSound() {
        if (!this.audioContext || this.isSpinSoundPlaying) return;
        
        try {
            this.isSpinSoundPlaying = true;
            this.playSpinLoop();
        } catch (error) {
            console.log('Could not play spin sound:', error);
        }
    }
    
    playSpinLoop() {
        if (!this.gameState.isFlipping || !this.audioContext) {
            this.isSpinSoundPlaying = false;
            return;
        }
        
        const { oscillator, gainNode } = this.createOscillator(300 + Math.random() * 200, 'sawtooth');
        if (!oscillator) return;
        
        // Adjusted volume for spinning sound (reduced from 0.4 to 0.25)
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.25, this.audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.08, this.audioContext.currentTime + 0.15);
        
        // Add frequency modulation for more interesting sound
        oscillator.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.1);
        oscillator.frequency.exponentialRampToValueAtTime(250, this.audioContext.currentTime + 0.2);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.2);
        
        // Continue loop
        setTimeout(() => {
            this.playSpinLoop();
        }, 150);
    }
    
    stopSpinSound() {
        this.isSpinSoundPlaying = false;
    }
    
    playWinSound() {
        if (!this.audioContext) return;
        
        try {
            // Play a triumphant chord progression
            const winNotes = [
                { freq: 523, delay: 0, duration: 0.4 },    // C5
                { freq: 659, delay: 0.1, duration: 0.4 },  // E5
                { freq: 784, delay: 0.2, duration: 0.4 },  // G5
                { freq: 1047, delay: 0.3, duration: 0.6 }  // C6
            ];
            
            winNotes.forEach(note => {
                setTimeout(() => {
                    this.playTone(note.freq, note.duration, 0.6, 'triangle');
                }, note.delay * 1000);
            });
            
            // Add a bell-like effect
            setTimeout(() => {
                this.playTone(1568, 0.8, 0.3, 'sine'); // G6
            }, 500);
            
        } catch (error) {
            console.log('Could not play win sound:', error);
        }
    }
    
    playLoseSound() {
        if (!this.audioContext) return;
        
        try {
            // Play a descending disappointed sound
            const loseNotes = [
                { freq: 392, delay: 0, duration: 0.3 },    // G4
                { freq: 349, delay: 0.2, duration: 0.3 },  // F4
                { freq: 294, delay: 0.4, duration: 0.3 },  // D4
                { freq: 262, delay: 0.6, duration: 0.6 }   // C4
            ];
            
            loseNotes.forEach(note => {
                setTimeout(() => {
                    this.playTone(note.freq, note.duration, 0.5, 'sawtooth');
                }, note.delay * 1000);
            });
            
        } catch (error) {
            console.log('Could not play lose sound:', error);
        }
    }
    
    playTone(frequency, duration, volume = 0.5, type = 'sine') {
        if (!this.audioContext) return;
        
        const { oscillator, gainNode } = this.createOscillator(frequency, type);
        if (!oscillator) return;
        
        // Enhanced volume and envelope
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    playSound(soundType) {
        // Ensure audio context is running
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        try {
            switch (soundType) {
                case 'spin':
                    this.playSpinSound();
                    break;
                case 'win':
                    this.playWinSound();
                    break;
                case 'lose':
                    this.playLoseSound();
                    break;
                default:
                    console.log('Unknown sound type:', soundType);
            }
        } catch (error) {
            console.log('Error playing sound:', error);
        }
    }
    
    stopSound(soundType) {
        if (soundType === 'spin') {
            this.stopSpinSound();
        }
    }
    
    // Blockchain result display
    showBlockchainResult(result, txResult) {
        const gameResult = document.getElementById('game-result');
        const resultTitle = document.getElementById('result-title');
        const resultText = document.getElementById('result-text');
        
        if (!gameResult || !resultTitle || !resultText) return;
        
        const isWin = result === this.gameState.selectedChoice;
        const betAmount = this.gameState.betAmount;
        
        resultTitle.textContent = isWin ? '🎉 You Won!' : '😔 You Lost!';
        resultTitle.className = isWin ? 'win-result' : 'lose-result';
        
        const txHashShort = txResult.txHash ? `${txResult.txHash.slice(0, 10)}...` : 'N/A';
        
        if (isWin) {
            resultText.innerHTML = `
                <p>The coin landed on <strong>${result.toUpperCase()}</strong>!</p>
                <p>You won <strong>${betAmount.toFixed(8)} ETH</strong>!</p>
                <p>Transaction Hash: <strong>${txHashShort}</strong></p>
                <p><em>Check your wallet for updated balance</em></p>
            `;
            resultText.className = 'win-result';
        } else {
            resultText.innerHTML = `
                <p>The coin landed on <strong>${result.toUpperCase()}</strong>!</p>
                <p>You lost <strong>${betAmount.toFixed(8)} ETH</strong>.</p>
                <p>Transaction Hash: <strong>${txHashShort}</strong></p>
                <p><em>Better luck next time!</em></p>
            `;
            resultText.className = 'lose-result';
        }
        
        gameResult.style.display = 'block';
        
        // Scroll to result
        gameResult.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    // Notification system
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
}

// Global functions for HTML onclick events
let coinflipGame;

function startCoinflip() {
    // Scroll to coinflip section
    const coinflipSection = document.querySelector('.coinflip-section');
    if (coinflipSection) {
        coinflipSection.scrollIntoView({ behavior: 'smooth' });
    }
}

function flipCoin() {
    if (coinflipGame) {
        coinflipGame.flipCoin();
    }
}

function resetGame() {
    if (coinflipGame) {
        coinflipGame.resetGame();
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    coinflipGame = new CoinflipGame();
    
    // Add some additional CSS for balance display
    const style = document.createElement('style');
    style.textContent = `
        .balance-display {
            margin-bottom: 1.5rem;
            padding: 1rem;
            background: linear-gradient(135deg, #16213e, #1a1b2e);
            border-radius: 8px;
            border: 1px solid rgba(243, 156, 18, 0.2);
        }
        
        .balance-info label {
            display: block;
            color: #f39c12;
            font-weight: 600;
            margin-bottom: 0.5rem;
        }
        
        .balance-amount {
            font-size: 1.2rem;
            font-weight: bold;
            color: #2ecc71;
        }
        
        .win-result {
            color: #2ecc71 !important;
        }
        
        .lose-result {
            color: #e74c3c !important;
        }
        
        #flip-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            background: #666;
        }
        
        .choice-btn.active {
            background: linear-gradient(135deg, #f39c12, #e67e22) !important;
            color: white !important;
            border-color: #f39c12 !important;
        }
    `;
    document.head.appendChild(style);
});
