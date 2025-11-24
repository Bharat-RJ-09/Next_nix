document.addEventListener('DOMContentLoaded', () => {
    const ADMIN_SESSION_KEY = 'nextEarnXAdminSession';
    const USER_STORAGE_KEY = "nextEarnXUsers";
    const GLOBAL_BALANCE_KEY = 'nextEarnXBalance'; // For main user balance (sender, depositor)
    const GLOBAL_HISTORY_KEY = 'nextEarnXHistory'; // For sender/depositor history
    
    const userTableBody = document.getElementById('userTableBody');
    const userSearchInput = document.getElementById('userSearchInput');
    const searchBtn = document.getElementById('searchBtn');
    const userCountElement = document.getElementById('userCount');
    
    // Modal Elements
    const modal = document.getElementById('editUserModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const modalUsername = document.getElementById('modalUsername');
    const editUsernameHidden = document.getElementById('editUsernameHidden');
    const editUserForm = document.getElementById('editUserForm');
    const newPasswordInput = document.getElementById('newPassword');
    const userStatusSelect = document.getElementById('userStatus');
    const subscriptionPlanSelect = document.getElementById('subscriptionPlan');
    const expiryDateInput = document.getElementById('expiryDate');

    // NEW WALLET MANAGEMENT ELEMENTS
    const currentWalletBalanceDisplay = document.getElementById('currentWalletBalance');
    const balanceActionSelect = document.getElementById('balanceAction');
    const balanceAmountInput = document.getElementById('balanceAmount');
    const balanceNoteInput = document.getElementById('balanceNote');


    // --- 1. SECURITY CHECK ---
    function checkAdminSession() {
        if (localStorage.getItem(ADMIN_SESSION_KEY) !== 'true') {
            alert('Access Denied. Please log in.');
            window.location.href = 'admin_login.html';
        }
    }
    checkAdminSession();

    // --- 2. DATA UTILITY (CRUD CORE) ---
    function loadUsers() {
        try {
            return JSON.parse(localStorage.getItem(USER_STORAGE_KEY) || "[]");
        } catch {
            return [];
        }
    }
    
    function saveUsers(users) {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(users));
    }

    function findUser(username) {
        return loadUsers().find(user => user.username === username);
    }
    
    function updateUser(usernameToUpdate, updates) {
        let users = loadUsers();
        let userIndex = users.findIndex(user => user.username === usernameToUpdate);

        if (userIndex !== -1) {
            users[userIndex] = { ...users[userIndex], ...updates };
            saveUsers(users);
            return true;
        }
        return false;
    }
    
    // --- NEW: BALANCE UTILITIES ---
    // Function to get the user's actual balance (using the recipient key logic for consistency)
    function getTargetBalance(username) {
        // NOTE: We assume 'nextEarnXBalance' is for the currently logged-in user.
        // For Admin to manage a *specific* user's balance, we use the user-specific key.
        const key = (username === findUser(username).username) ? GLOBAL_BALANCE_KEY : `nextEarnXBalance_${username}`;
        try {
            return parseFloat(localStorage.getItem(key) || '0.00');
        } catch {
            return 0.00;
        }
    }

    // Function to set the user's actual balance
    function setTargetBalance(username, balance) {
        const key = (username === findUser(username).username) ? GLOBAL_BALANCE_KEY : `nextEarnXBalance_${username}`;
        localStorage.setItem(key, balance.toFixed(2));
    }
    
    // Function to get the user's transaction history
    function getTargetHistory(username) {
        const key = (username === findUser(username).username) ? GLOBAL_HISTORY_KEY : `nextEarnXHistory_${username}`;
        try { return JSON.parse(localStorage.getItem(key) || '[]'); }
        catch { return []; }
    }

    // Function to save the user's transaction history
    function saveTargetHistory(username, history) {
        const key = (username === findUser(username).username) ? GLOBAL_HISTORY_KEY : `nextEarnXHistory_${username}`;
        localStorage.setItem(key, JSON.stringify(history));
    }
    
    // --- 3. MODAL HANDLERS ---
    function openEditModal(username) {
        const user = findUser(username);
        if (!user) {
            alert("Error: User data not found.");
            return;
        }
        
        modalUsername.textContent = username;
        editUsernameHidden.value = username;
        newPasswordInput.value = ''; 
        
        // Load Status
        const currentStatus = user.status || 'active'; 
        userStatusSelect.value = currentStatus;
        
        // Load Subscription
        const currentPlan = user.plan || 'none';
        const currentExpiry = user.expiry ? new Date(user.expiry).toISOString().substring(0, 10) : '';
        subscriptionPlanSelect.value = currentPlan;
        expiryDateInput.value = currentExpiry;
        
        // NEW: Load Current Balance
        const currentBalance = getTargetBalance(username);
        currentWalletBalanceDisplay.textContent = `₹${currentBalance.toFixed(2)}`;
        
        // Reset Wallet Form fields
        balanceActionSelect.value = 'none';
        balanceAmountInput.value = '';
        balanceNoteInput.value = '';

        modal.style.display = 'flex';
    }

    function closeEditModal() {
        modal.style.display = 'none';
        editUserForm.reset();
    }
    
    closeModalBtn.addEventListener('click', closeEditModal);

    editUserForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = editUsernameHidden.value;
        const updates = {};
        
        // --- 1. HANDLE BALANCE ADJUSTMENT ---
        const action = balanceActionSelect.value;
        const amount = parseFloat(balanceAmountInput.value);
        const note = balanceNoteInput.value.trim() || 'Admin Manual Adjustment';
        let balanceChanged = false;

        if (action !== 'none' && !isNaN(amount) && amount > 0) {
            let currentBalance = getTargetBalance(username);
            let newBalance = currentBalance;
            let transactionType = 'UNKNOWN';

            if (action === 'credit') {
                newBalance += amount;
                transactionType = 'credit';
            } else if (action === 'debit') {
                if (currentBalance < amount) {
                    alert(`❌ Error: Cannot deduct ₹${amount.toFixed(2)}. User's current balance is only ₹${currentBalance.toFixed(2)}.`);
                    return; 
                }
                newBalance -= amount;
                transactionType = 'debit';
            }
            
            // Perform Balance Update
            setTargetBalance(username, newBalance);
            balanceChanged = true;

            // Record Transaction History
            let history = getTargetHistory(username);
            history.push({
                date: Date.now(),
                type: transactionType,
                amount: amount,
                txnId: `ADMIN_${transactionType.toUpperCase()}_${Date.now()}`,
                note: `Admin Adjustment: ${note}`
            });
            saveTargetHistory(username, history);
        }
        
        // --- 2. HANDLE USER PROFILE UPDATES (Password, Status, Subscription) ---
        
        // Password Update
        if (newPasswordInput.value.trim() !== '') {
            updates.password = newPasswordInput.value.trim();
        }
        
        // Status Update
        updates.status = userStatusSelect.value; 

        // Subscription Update
        const selectedPlan = subscriptionPlanSelect.value;
        const expiryDate = expiryDateInput.value;

        if (selectedPlan === 'none') {
            updates.plan = null;
            updates.expiry = null;
        } else {
            updates.plan = selectedPlan;
            updates.expiry = new Date(expiryDate).getTime();
        }
        
        // --- 3. FINAL SAVE & UI REFRESH ---
        if (Object.keys(updates).length > 0 || balanceChanged) {
            updateUser(username, updates);
            
            const actionMsg = balanceChanged ? `Wallet updated by ${action.toUpperCase()} of ₹${amount.toFixed(2)} and ` : '';
            alert(`✅ User ${username} updated successfully! ${actionMsg}Profile saved.`);
            
            closeEditModal();
            renderUserTable(loadUsers()); // Re-render table
        } else {
            alert('⚠️ No changes detected for saving.');
            closeEditModal();
        }
    });


    // --- 4. RENDERING & INITIALIZATION (Unchanged) ---
    function renderUserTable(users) {
        userTableBody.innerHTML = ''; 
        
        if (users.length === 0) {
            userTableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No users found.</td></tr>';
            userCountElement.textContent = '0 users displayed.';
            return;
        }

        users.forEach((user, index) => {
            const row = userTableBody.insertRow();
            const userId = index + 1; 
            
            const userStatus = user.status || 'active'; 
            const statusClass = userStatus === 'banned' ? 'status-banned' : userStatus === 'frozen' ? 'status-frozen' : 'status-active';

            row.innerHTML = `
                <td>${userId}</td>
                <td>${user.username}</td>
                <td>${user.fullname}</td>
                <td>${user.email}</td>
                <td>${user.mobile}</td>
                <td class="${statusClass}">${userStatus.charAt(0).toUpperCase() + userStatus.slice(1)}</td>
                <td class="action-buttons">
                    <button class="edit-btn" data-username="${user.username}"><i class="ri-edit-2-line"></i> Edit</button>
                    <button class="delete-btn" data-username="${user.username}"><i class="ri-delete-bin-line"></i> Delete</button>
                </td>
            `;
        });
        userCountElement.textContent = `${users.length} users displayed. Total registered users: ${loadUsers().length}`;

        attachActionListeners();
    }

    // --- 5. SEARCH/FILTERING (Unchanged) ---
    function searchUsers() {
        const query = userSearchInput.value.toLowerCase();
        const allUsers = loadUsers();
        
        const filteredUsers = allUsers.filter(user => 
            user.username.toLowerCase().includes(query) ||
            user.email.toLowerCase().includes(query) ||
            user.fullname.toLowerCase().includes(query)
        );
        
        renderUserTable(filteredUsers);
    }

    searchBtn.addEventListener('click', searchUsers);
    userSearchInput.addEventListener('keyup', searchUsers); 

    // --- 6. ACTION LISTENERS (Unchanged) ---
    function attachActionListeners() {
        document.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const username = e.currentTarget.dataset.username;
                openEditModal(username); 
            });
        });

        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const username = e.currentTarget.dataset.username;
                if (confirm(`WARNING: Are you sure you want to delete user "${username}"? This cannot be undone.`)) {
                    if (deleteUser(username)) {
                        alert(`✅ User ${username} deleted successfully!`);
                        renderUserTable(loadUsers());
                    } else {
                        alert(`❌ Error: User ${username} not found.`);
                    }
                }
            });
        });
    }
    function deleteUser(usernameToDelete) {
        let users = loadUsers();
        const initialLength = users.length;
        users = users.filter(user => user.username !== usernameToDelete);
        
        if (users.length < initialLength) {
            saveUsers(users);
            return true;
        } else {
            return false;
        }
    }


    // --- INITIALIZE ---
    renderUserTable(loadUsers());
});