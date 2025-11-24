// panel/js/ban_numbers.js - Ban Numbers Management Logic

document.addEventListener('DOMContentLoaded', () => {
    
    const BAN_NUMBERS_KEY = 'nextEarnXBanNumbers';
    
    // UI Elements
    const banNumbersForm = document.getElementById('banNumbersForm');
    const banNumbersInput = document.getElementById('banNumbersInput');
    const totalBannedCountDisplay = document.getElementById('totalBannedCount');
    const currentBanListContainer = document.getElementById('currentBanList');
    const logArea = document.getElementById('logArea');
    const logoutBtn = document.getElementById('logoutBtn');

    let bannedNumbers = [];

    // --- UTILITIES ---
    function loadBannedNumbers() {
        try {
            const raw = localStorage.getItem(BAN_NUMBERS_KEY);
            // Ensure numbers are unique and strings
            bannedNumbers = JSON.parse(raw || '[]').filter(n => typeof n === 'string');
            // Remove duplicates on load
            bannedNumbers = Array.from(new Set(bannedNumbers));
        } catch {
            bannedNumbers = [];
        }
        return bannedNumbers;
    }

    function saveBannedNumbers() {
        localStorage.setItem(BAN_NUMBERS_KEY, JSON.stringify(Array.from(new Set(bannedNumbers))));
    }
    
    function appendLog(message, type = 'info') {
        const p = document.createElement('p');
        p.innerHTML = `[${new Date().toLocaleTimeString()}] ${message}`;
        p.style.color = type === 'success' ? '#aaffaa' : type === 'error' ? '#ffaaaa' : '#e0e0e0';
        logArea.prepend(p);
    }
    
    // --- UI RENDERING ---
    function renderBanList() {
        loadBannedNumbers(); // Ensure latest list is loaded
        currentBanListContainer.innerHTML = '';
        totalBannedCountDisplay.textContent = bannedNumbers.length;

        if (bannedNumbers.length === 0) {
            currentBanListContainer.innerHTML = '<p>No numbers currently banned.</p>';
            return;
        }

        bannedNumbers.forEach(number => {
            const item = document.createElement('div');
            item.classList.add('banned-number-item');
            item.innerHTML = `
                <span>${number}</span>
                <button class="remove-single-btn" data-number="${number}">Remove</button>
            `;
            currentBanListContainer.appendChild(item);
        });

        attachRemoveListeners();
    }

    // --- EVENT HANDLERS ---
    
    // 1. Add Numbers Form Submission
    banNumbersForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const input = banNumbersInput.value.trim();
        if (!input) return;

        // Parse input: split by comma, period, space, or newline
        const newNumbers = input.split(/[,. \s\n]+/)
                                .map(n => n.trim())
                                .filter(n => n.length === 10 && !isNaN(n)); // Basic validation: 10 digit number

        if (newNumbers.length === 0) {
            appendLog('Error: No valid 10-digit numbers found.', 'error');
            return;
        }

        let addedCount = 0;
        newNumbers.forEach(number => {
            if (!bannedNumbers.includes(number)) {
                bannedNumbers.push(number);
                addedCount++;
            }
        });

        saveBannedNumbers();
        renderBanList();
        
        appendLog(`SUCCESS: Added ${addedCount} new number(s) to the ban list.`, 'success');
        banNumbersInput.value = '';
    });

    // 2. Remove Single Number
    function attachRemoveListeners() {
        document.querySelectorAll('.remove-single-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const numberToRemove = e.currentTarget.dataset.number;
                
                if (confirm(`Are you sure you want to remove ${numberToRemove} from the ban list?`)) {
                    bannedNumbers = bannedNumbers.filter(n => n !== numberToRemove);
                    saveBannedNumbers();
                    renderBanList();
                    appendLog(`Removed ${numberToRemove} from the ban list.`, 'info');
                }
            });
        });
    }

    // 3. Logout
    if(logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('session');
            localStorage.removeItem('nextEarnXCurrentUser');
            alert("Logged out from NextEarnX!");
            window.location.href = 'login.html';
        });
    }

    // --- INITIALIZE ---
    renderBanList();
});