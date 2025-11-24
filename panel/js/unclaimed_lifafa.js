// panel/js/unclaimed_lifafa.js - Active Lifafas Management Logic + Special Check (URL FIX + OPEN BUTTON)

document.addEventListener('DOMContentLoaded', () => {
    
    // Keys
    const LIFAFA_STORAGE_KEY = 'nextEarnXLifafas'; 
    const USER_KEY = 'nextEarnXCurrentUser';
    const GLOBAL_BALANCE_KEY = 'nextEarnXBalance';
    const GLOBAL_HISTORY_KEY = 'nextEarnXHistory';
    
    // UI Elements
    const totalActiveCountDisplay = document.getElementById('totalActiveCount');
    const totalUnclaimedAmountDisplay = document.getElementById('totalUnclaimedAmount');
    const lifafaListContainer = document.getElementById('lifafaListContainer');
    const refreshBtn = document.getElementById('refreshBtn');
    const refundAllBtn = document.getElementById('refundAllBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    
    // NEW CHECK ELEMENTS
    const checkLifafaForm = document.getElementById('checkLifafaForm');
    const checkMobileInput = document.getElementById('checkMobileInput');
    const checkResultArea = document.getElementById('checkResultArea');
    
    let senderUsername = '';

    // --- UTILITIES ---
    function getSenderUsername() {
        try {
            const user = JSON.parse(localStorage.getItem(USER_KEY));
            senderUsername = user ? user.username : ''; 
        } catch { return; }
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
    
    function saveHistory(history) {
        localStorage.setItem(GLOBAL_HISTORY_KEY, JSON.stringify(history));
    }
    
    function loadLifafas() {
        try { return JSON.parse(localStorage.getItem(LIFAFA_STORAGE_KEY) || '[]'); }
        catch { return []; }
    }
    
    function saveLifafas(lifafas) {
        localStorage.setItem(LIFAFA_STORAGE_KEY, JSON.stringify(lifafas));
    }
    
    function getActiveUserLifafas() {
        const allLifafas = loadLifafas();
        return allLifafas.filter(l => 
            l.creator === senderUsername && l.claims.length < l.count
        );
    }
    
    // URL GENERATION
    function generateFullUrl(lifafaId) {
        // Assuming 'claim.html' is one level up from 'panel/js' if accessed via full path
        // Adjusted to reflect the common structure: /panel/claim.html
        return `${window.location.origin}/panel/claim.html?id=${lifafaId}`;
    }
    
    // MOCK Short URL: For simplicity, it points to the full claim page URL but has a short-looking title/path.
    function generateShortUrl(lifafaId) {
        const mockShortId = btoa(lifafaId).replace(/=/g, '').slice(0, 8);
        return `${window.location.origin}/c/${mockShortId}`; 
    }
    
    // --- CORE RENDERING ---
    function renderLifafaList() {
        const activeLifafas = getActiveUserLifafas();
        let totalUnclaimed = 0;
        let activeCount = 0;
        
        lifafaListContainer.innerHTML = '';

        if (activeLifafas.length === 0) {
            lifafaListContainer.innerHTML = '<p>🎉 No pending Lifafas found. All are claimed or closed.</p>';
            totalActiveCountDisplay.textContent = '0';
            totalUnclaimedAmountDisplay.textContent = '₹0.00';
            refundAllBtn.disabled = true;
            return;
        }

        activeCount = activeLifafas.length;
        
        activeLifafas.forEach(l => {
            const claimed = l.claims.length;
            const remainingClaims = l.count - claimed;
            const remainingAmount = remainingClaims * l.perClaim;
            totalUnclaimed += remainingAmount;
            
            const fullLink = generateFullUrl(l.id);
            const shortLink = generateShortUrl(l.id); 
            
            const item = document.createElement('div');
            item.classList.add('lifafa-item');
            
            item.innerHTML = `
                <h4>${l.title || 'Untitled Lifafa'} (ID: ${l.id})</h4>
                <p>Created: ${new Date(l.date).toLocaleString()} | Type: ${l.type}</p>
                <div class="stats">
                    <span>Total Value: <b>₹${l.totalAmount.toFixed(2)}</b></span>
                    <span>Remaining Claims: <b class="status-open">${remainingClaims}</b> / ${l.count}</span>
                    <span>Unclaimed Amount: <b class="status-open">₹${remainingAmount.toFixed(2)}</b></span>
                    <button class="remove-single-lifafa-btn" data-id="${l.id}" data-amount="${remainingAmount.toFixed(2)}">Refund</button>
                </div>
                
                <div class="link-control-area">
                    <p>Lifafa Actions:</p>
                    <div class="link-options">
                        
                        <a href="${fullLink}" target="_blank" class="open-lifafa-btn">
                            <i class="ri-external-link-line"></i> Open Lifafa
                        </a>
                        
                        <button class="copy-link-btn copy-full-btn" 
                                data-link="${fullLink}" title="${fullLink}">
                            <i class="ri-file-copy-line"></i> Full URL
                        </button>
                        
                        <button class="copy-link-btn copy-short-btn" 
                                data-link="${fullLink}" title="${shortLink}"> 
                            <i class="ri-scissors-cut-line"></i> Short URL
                        </button>
                    </div>
                </div>
                `;
            lifafaListContainer.appendChild(item);
        });
        
        totalActiveCountDisplay.textContent = activeCount;
        totalUnclaimedAmountDisplay.textContent = `₹${totalUnclaimed.toFixed(2)}`;
        refundAllBtn.disabled = false;
        
        attachRefundListeners(loadLifafas());
        attachCopyListeners(); 
    }
    
    // --- SPECIAL CHECK LOGIC (Unchanged) ---
    if (checkLifafaForm) {
        checkLifafaForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const mobile = checkMobileInput.value.trim();
            checkResultArea.innerHTML = '';

            if (mobile.length !== 10 || isNaN(mobile)) {
                checkResultArea.innerHTML = '<p style="color:red;">Enter a valid 10-digit mobile number.</p>';
                return;
            }

            const activeLifafas = getActiveUserLifafas();
            const foundLifafas = [];
            
            activeLifafas.forEach(lifafa => {
                const isSpecialUser = lifafa.specialUsers && lifafa.specialUsers.includes(mobile);
                
                if (isSpecialUser) {
                    foundLifafas.push(lifafa);
                }
            });

            if (foundLifafas.length > 0) {
                checkResultArea.innerHTML = `<p style="color: #aaffaa; font-weight:bold;">✅ Found ${foundLifafas.length} Lifafa(s) where ${mobile} is a Special User:</p>`;
                foundLifafas.forEach(lifafa => {
                    const item = document.createElement('div');
                    item.classList.add('found-item');
                    item.innerHTML = `
                        - <b>${lifafa.title || 'Untitled Lifafa'}</b> (ID: ${lifafa.id.slice(-4)})
                        (Per Claim: ₹${lifafa.perClaim.toFixed(2)})
                    `;
                    checkResultArea.appendChild(item);
                });
            } else {
                checkResultArea.innerHTML = `<p style="color: #ffcc00;">❌ ${mobile} is not listed in any of your active Special Lifafas.</p>`;
            }
        });
    }

    // --- EVENT HANDLERS ---
    
    // Copy Link Listener (Unchanged)
    function attachCopyListeners() {
        document.querySelectorAll('.copy-link-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const linkToCopy = e.currentTarget.dataset.link;
                navigator.clipboard.writeText(linkToCopy);
                alert(`✅ Link copied to clipboard! \n${linkToCopy}`);
            });
        });
    }
    
    // 1. Refresh (Unchanged)
    refreshBtn.addEventListener('click', renderLifafaList);

    // 2. Refund All (Unchanged)
    refundAllBtn.addEventListener('click', () => {
        const totalAmount = parseFloat(totalUnclaimedAmountDisplay.textContent.replace('₹', ''));
        const activeCount = parseInt(totalActiveCountDisplay.textContent);
        
        if (totalAmount === 0 || activeCount === 0) {
            alert("No amount to refund.");
            return;
        }
        
        if (confirm(`CONFIRM: Refund ₹${totalAmount.toFixed(2)} from ${activeCount} Lifafas? This will close all active Lifafas.`)) {
            
            const currentBalance = getBalance();
            const newBalance = currentBalance + totalAmount;
            setBalance(newBalance);
            
            let allLifafas = loadLifafas().filter(l => !(l.creator === senderUsername && l.claims.length < l.count));
            saveLifafas(allLifafas);

            let history = getHistory();
            history.push({
                date: Date.now(),
                type: 'credit',
                amount: totalAmount,
                txnId: 'REFUND_BULK_' + Date.now(),
                note: `Bulk refund for ${activeCount} unclaimed Lifafas`
            });
            saveHistory(history);
            
            alert(`✅ Refund Successful! ₹${totalAmount.toFixed(2)} credited. New Balance: ₹${newBalance.toFixed(2)}.`);
            renderLifafaList();
        }
    });

    // 3. Refund Single (Unchanged)
    function attachRefundListeners(allLifafas) {
        document.querySelectorAll('.remove-single-lifafa-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const lifafaId = e.currentTarget.dataset.id;
                const refundAmount = parseFloat(e.currentTarget.dataset.amount);

                if (confirm(`CONFIRM: Refund remaining ₹${refundAmount.toFixed(2)} for Lifafa ID ${lifafaId}?`)) {
                    
                    const currentBalance = getBalance();
                    const newBalance = currentBalance + refundAmount;
                    setBalance(newBalance);
                    
                    let updatedLifafas = allLifafas.filter(l => l.id !== lifafaId);
                    saveLifafas(updatedLifafas);
                    
                    let history = getHistory();
                    history.push({
                        date: Date.now(),
                        type: 'credit',
                        amount: refundAmount,
                        txnId: 'REFUND_SINGLE_' + lifafaId,
                        note: `Single Lifafa refund (ID: ${lifafaId})`
                    });
                    saveHistory(history);

                    alert(`✅ Refund Successful! ₹${refundAmount.toFixed(2)} credited.`);
                    renderLifafaList();
                }
            });
        });
    }

    // 4. Logout (Unchanged)
    if(logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('session');
            localStorage.removeItem(USER_KEY);
            alert("Logged out from NextEarnX!");
            window.location.href = 'login.html';
        });
    }


    // --- INITIALIZE ---
    getSenderUsername();
    renderLifafaList();
});