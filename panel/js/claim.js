// panel/js/claim.js - Lifafa Claim Logic with Validation Checks

document.addEventListener('DOMContentLoaded', () => {
    
    // UI Elements
    const claimContainer = document.getElementById('claimSection');
    const loadingState = document.getElementById('loadingState');
    const errorState = document.getElementById('errorState');
    const errorTitle = document.getElementById('errorTitle');
    const errorMessage = document.getElementById('errorMessage');

    const lifafaTitleDisplay = document.getElementById('lifafaTitle');
    const creatorUsernameDisplay = document.getElementById('creatorUsername');
    const claimAmountDisplay = document.getElementById('claimAmountDisplay');
    const claimCountDisplay = document.getElementById('claimCountDisplay');

    const reqStatusBan = document.getElementById('reqStatusBan');
    const reqStatusCode = document.getElementById('reqStatusCode');
    const reqStatusTelegram = document.getElementById('reqStatusTelegram');
    const reqStatusReferral = document.getElementById('reqStatusReferral');
    
    const accessCodeForm = document.getElementById('accessCodeForm');
    const accessCodeInput = document.getElementById('accessCodeInput');
    const mainClaimBtn = document.getElementById('mainClaimBtn');
    const claimLog = document.getElementById('claimLog');
    const logoutBtn = document.getElementById('logoutBtn');

    // Keys and Storage
    const LIFAFA_STORAGE_KEY = 'nextEarnXLifafas'; 
    const BAN_NUMBERS_KEY = 'nextEarnXBanNumbers';
    const USER_KEY = 'nextEarnXCurrentUser';
    const GLOBAL_BALANCE_KEY = 'nextEarnXBalance';
    const GLOBAL_HISTORY_KEY = 'nextEarnXHistory';
    
    let lifafaId = new URLSearchParams(location.search).get('id');
    let currentUser = null;
    let lifafaData = null;
    let claimChecksPassed = {}; // Object to track individual check status

    // --- UTILITIES ---
    
    function appendLog(message, type = 'info') {
        const p = document.createElement('p');
        p.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        p.style.color = type === 'error' ? '#ff0077' : type === 'success' ? '#aaffaa' : '#e0e0e0';
        claimLog.prepend(p);
    }
    
    function getBalance() {
        try { return parseFloat(localStorage.getItem(GLOBAL_BALANCE_KEY) || '0.00'); }
        catch { return 0.00; }
    }
    
    function setBalance(balance) {
        localStorage.setItem(GLOBAL_BALANCE_KEY, balance.toFixed(2));
    }
    
    function getHistory() {
        try { return JSON.parse(localStorage.getItem(GLOBAL_HISTORY_KEY) || '[]'); }
        catch { return []; }
    }
    
    // Function to update requirement status UI
    function updateReqStatus(element, success, message) {
        element.textContent = message;
        element.classList.remove('status-pending', 'status-success', 'status-failed');
        if (success === true) {
            element.classList.add('status-success');
            element.querySelector('i').className = 'ri-checkbox-circle-fill';
        } else if (success === false) {
            element.classList.add('status-failed');
            element.querySelector('i').className = 'ri-close-circle-fill';
        } else {
            element.classList.add('status-pending');
            element.querySelector('i').className = 'ri-lock-line';
        }
    }
    
    // --- AUTH AND INITIAL LOAD ---

    function loadInitialData() {
        // 1. Check Login
        try {
            currentUser = JSON.parse(localStorage.getItem(USER_KEY));
        } catch {}
        
        if (!currentUser) {
            // If not logged in, redirect to login page with claim ID
            window.location.href = `login.html?redirect=claim.html?id=${lifafaId}`;
            return false;
        }

        // 2. Load Lifafa Data
        if (!lifafaId) {
            showError("Invalid Link", "Lifafa ID is missing from the URL.");
            return false;
        }

        const allLifafas = JSON.parse(localStorage.getItem(LIFAFA_STORAGE_KEY) || '[]');
        lifafaData = allLifafas.find(l => l.id === lifafaId);

        if (!lifafaData) {
            showError("Lifafa Not Found", "The link is invalid or the Lifafa has expired/closed.");
            return false;
        }
        
        // 3. Check Expiry/Closure (Mock)
        if (lifafaData.claims.length >= lifafaData.count) {
             showError("Lifafa Closed", "All slots for this Lifafa have been claimed.");
             return false;
        }
        
        return true;
    }
    
    function showContent() {
        loadingState.style.display = 'none';
        claimContainer.style.display = 'block';
        document.getElementById('logoutBtn').style.display = 'block';

        // Update UI details
        lifafaTitleDisplay.textContent = lifafaData.title;
        creatorUsernameDisplay.textContent = lifafaData.creator;
        claimAmountDisplay.textContent = `₹${lifafaData.perClaim.toFixed(2)}`;
        claimCountDisplay.textContent = `${lifafaData.claims.length}/${lifafaData.count}`;
        
        // Run all checks
        checkAllRequirements();
    }
    
    function showError(title, message) {
        loadingState.style.display = 'none';
        errorState.style.display = 'block';
        errorTitle.textContent = title;
        errorMessage.textContent = message;
    }
    
    // --- CORE REQUIREMENTS CHECKER ---
    
    function checkBanStatus() {
        const bannedNumbers = JSON.parse(localStorage.getItem(BAN_NUMBERS_KEY) || '[]');
        const isBanned = bannedNumbers.includes(currentUser.mobile);
        
        if (isBanned) {
            updateReqStatus(reqStatusBan, false, "Banned: Cannot claim Lifafa.");
            claimChecksPassed.ban = false;
        } else {
            updateReqStatus(reqStatusBan, true, "Banned Status: Passed.");
            claimChecksPassed.ban = true;
        }
        return claimChecksPassed.ban;
    }
    
    function checkClaimedStatus() {
        const alreadyClaimed = lifafaData.claims.some(c => c.username === currentUser.username);
        if (alreadyClaimed) {
             showError("Already Claimed", `You have already claimed this Lifafa on ${new Date(lifafaData.claims.find(c => c.username === currentUser.username).date).toLocaleString()}.`);
             claimChecksPassed.claimed = false;
             return false;
        }
        claimChecksPassed.claimed = true;
        return true;
    }

    function checkAccessCode() {
        if (lifafaData.accessCode) {
            reqStatusCode.textContent = "Access Code: Required (Enter below)";
            accessCodeForm.style.display = 'block';
            mainClaimBtn.disabled = true;
            claimChecksPassed.code = false;
        } else {
            updateReqStatus(reqStatusCode, true, "Access Code: Not Required.");
            claimChecksPassed.code = true;
        }
    }
    
    function checkTelegram() {
        const requiredChannels = lifafaData.requirements?.channels || [];
        
        if (requiredChannels.length > 0) {
            // MOCK: Assume user has joined if we are in a dev environment. In a real app, this requires Telegram API.
            updateReqStatus(reqStatusTelegram, true, `Telegram Join: ${requiredChannels.length} channels required (MOCK: Passed)`);
            claimChecksPassed.telegram = true;
        } else {
            updateReqStatus(reqStatusTelegram, true, "Telegram Join: Not Required.");
            claimChecksPassed.telegram = true;
        }
    }
    
    function checkReferral() {
         const requiredRef = lifafaData.requirements?.referrals;
         
         if (requiredRef) {
             // MOCK: Assume user has met requirement
             updateReqStatus(reqStatusReferral, true, `Referrals: ${requiredRef} required (MOCK: Passed)`);
             claimChecksPassed.referral = true;
         } else {
             updateReqStatus(reqStatusReferral, true, "Referrals: Not Required.");
             claimChecksPassed.referral = true;
         }
    }

    function checkAllRequirements() {
        if (!checkClaimedStatus()) return; 
        if (!checkBanStatus()) return; 
        
        checkAccessCode();
        checkTelegram();
        checkReferral();
        
        // If code is NOT required, or if all other checks pass, enable button
        const allSimpleChecksPass = claimChecksPassed.ban && claimChecksPassed.telegram && claimChecksPassed.referral;
        
        if (allSimpleChecksPass && !lifafaData.accessCode) {
            mainClaimBtn.disabled = false;
        }
    }
    
    // --- EVENT HANDLERS ---
    
    // 1. Access Code Verification
    accessCodeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const enteredCode = accessCodeInput.value.trim();
        
        if (enteredCode === lifafaData.accessCode) {
            updateReqStatus(reqStatusCode, true, "Access Code: Verified.");
            accessCodeForm.style.display = 'none';
            claimChecksPassed.code = true;
            
            if (claimChecksPassed.ban && claimChecksPassed.telegram && claimChecksPassed.referral) {
                 mainClaimBtn.disabled = false;
                 appendLog("Access code correct. Ready to claim.", 'success');
            }
        } else {
            alert("❌ Incorrect Access Code. Try again.");
            updateReqStatus(reqStatusCode, false, "Access Code: Failed.");
            claimChecksPassed.code = false;
        }
    });

    // 2. Main Claim Action
    mainClaimBtn.addEventListener('click', () => {
        if (mainClaimBtn.disabled) return;
        
        if (!confirm(`Confirm claim of ₹${lifafaData.perClaim.toFixed(2)}?`)) return;
        
        // Perform final credit
        const claimAmount = lifafaData.perClaim;
        const currentBalance = getBalance();
        const newBalance = currentBalance + claimAmount;
        
        // Credit to user's wallet
        setBalance(newBalance);
        
        // Update Lifafa history
        lifafaData.claims.push({
            username: currentUser.username,
            date: Date.now(),
            amount: claimAmount
        });
        
        // Save the updated Lifafa List
        const allLifafas = JSON.parse(localStorage.getItem(LIFAFA_STORAGE_KEY));
        const index = allLifafas.findIndex(l => l.id === lifafaId);
        if (index !== -1) {
            allLifafas[index] = lifafaData;
            localStorage.setItem(LIFAFA_STORAGE_KEY, JSON.stringify(allLifafas));
        }
        
        // Record transaction
        let history = getHistory();
        history.push({
            date: Date.now(),
            type: 'credit',
            amount: claimAmount,
            txnId: 'LIFAFA_CLAIM_' + lifafaId,
            note: `Claimed Lifafa: ${lifafaData.title}`
        });
        localStorage.setItem(GLOBAL_HISTORY_KEY, JSON.stringify(history));


        // Final Success Message
        appendLog(`🎉 SUCCESS: ₹${claimAmount.toFixed(2)} credited! New Balance: ₹${newBalance.toFixed(2)}`, 'success');
        alert(`🎉 Successfully claimed ₹${claimAmount.toFixed(2)}!`);
        
        // Disable button and show final link (if any)
        mainClaimBtn.disabled = true;
        mainClaimBtn.textContent = "Claimed!";
        
        if(lifafaData.redirectLink) {
            document.getElementById('finalStatusMessage').innerHTML = `<p>Redirecting to <a href="${lifafaData.redirectLink}" target="_blank">Creator's Link</a>...</p>`;
            setTimeout(() => {
                window.location.href = lifafaData.redirectLink;
            }, 3000);
        }
    });
    
    // 3. Logout
    if(logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('session');
            localStorage.removeItem(USER_KEY);
            alert("Logged out from NextEarnX!");
            window.location.href = 'login.html';
        });
    }


    // --- INITIALIZE ---
    if (loadInitialData()) {
        showContent();
    }
});