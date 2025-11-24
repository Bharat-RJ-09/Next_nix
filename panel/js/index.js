// panel/js/index.js - Frontend Logic (API Dependent)

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 0. UI ELEMENTS ---
    const usernameDisplay = document.getElementById('usernameDisplay');
    const balanceDisplay = document.getElementById('balanceDisplay'); 
    const subscriptionStatus = document.getElementById('subscriptionStatus');
    const addFundsBtn = document.getElementById('addFundsBtn');
    
    // --- API & DATA STUBS (PHP se data aayega) ---
    // In functions mein data server se aane ke baad UI update hoga.
    function getBalanceFromDOM() {
        // Assume balance is pre-filled by PHP in the span
        const balanceText = balanceDisplay ? balanceDisplay.textContent.replace('₹', '').trim() : '0.00';
        return parseFloat(balanceText) || 0.00;
    }
    
    function getSubscriptionStatusFromDOM() {
        // Assume PHP provides a global variable or status class on the body/user element
        // For now, we'll check if the subscriptionStatus element has a green color (mock check)
        return subscriptionStatus && subscriptionStatus.style.color === 'rgb(170, 255, 170)'; // #aaffaa (Green)
    }

    function getCurrentUsernameFromDOM() {
        // Assume username is pre-filled by PHP
        return usernameDisplay ? usernameDisplay.textContent.trim() : 'Guest'; 
    }

    // --- 1. CORE LOGOUT LOGIC & SIDEBAR ---
    const logoutBtn = document.getElementById('logoutBtn');
    const sidebarLogoutBtn = document.getElementById('sidebarLogout');

    function handleLogout() {
        // Placeholder for API call to end server session
        fetch('/api/logout.php', { method: 'POST' })
            .then(() => {
                alert("Logged out from NextEarnX!");
                window.location.href = 'login.html';
            })
            .catch(e => {
                 console.error('Logout failed:', e);
                 alert("Logout successful (Local UI only)!");
                 window.location.href = 'login.html';
            });
    }

    if(logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if(sidebarLogoutBtn) sidebarLogoutBtn.addEventListener('click', (e) => {
        e.preventDefault(); 
        handleLogout();
    });

    // Sidebar Toggle Logic
    const sidebar = document.getElementById('sidebar');
    const menuBtn = document.getElementById('menuBtn');
    const closeSidebarBtn = document.getElementById('closeSidebarBtn');

    function toggleSidebar() {
        if (sidebar) {
            sidebar.classList.toggle('open');
        }
    }

    if(menuBtn) menuBtn.addEventListener('click', toggleSidebar);
    if(closeSidebarBtn) closeSidebarBtn.addEventListener('click', toggleSidebar);

    
    // --- 2. DASHBOARD UI UPDATES (STATUS, BALANCE & LOCKS) ---

    function updateUsernameUI() {
        // This function now just reads the pre-rendered content
        if (usernameDisplay) {
            const currentUsername = getCurrentUsernameFromDOM();
            usernameDisplay.textContent = currentUsername.charAt(0).toUpperCase() + currentUsername.slice(1);
        }
    }
    
    function updateBalanceUI() {
        // This function just reads the pre-rendered content
        if (balanceDisplay) {
            balanceDisplay.textContent = `₹${getBalanceFromDOM().toFixed(2)}`;
        }
    }
    
    // PHP will inject subscription details (plan, expiry) into the HTML
    function updateSubscriptionStatus() {
        // Status element check - PHP should pre-render this.
        if (subscriptionStatus) {
            if (getSubscriptionStatusFromDOM()) {
                // If subscribed, PHP should have set innerHTML and color
                // e.g., subscriptionStatus.style.color = '#aaffaa';
            } else {
                // If not subscribed, PHP should have set innerHTML and color
                // e.g., subscriptionStatus.innerHTML = `Status: <b style="color:#ff0077;">Not Subscribed</b>`;
            }
        }
    }
    
    function refreshFeatureLocks() {
        const subscribed = getSubscriptionStatusFromDOM();
        
        document.querySelectorAll('.feature-link').forEach(link => {
            const cardItem = link.querySelector('.feature-card-item') || link.querySelector('.quick-feature-card');
            const badge = cardItem ? cardItem.querySelector('.lock-badge') : null;
            
            const feature = link.dataset.feature;
            if (['Telegram Channel', 'Contact Us'].includes(feature)) return; 
            
            if(badge) {
                if(subscribed) { 
                    badge.textContent = ''; 
                    cardItem.classList.remove('locked'); 
                    link.classList.remove('locked');
                } else { 
                    badge.textContent = '🔒'; 
                    cardItem.classList.add('locked'); 
                    link.classList.add('locked');
                }
            }
        });
    }

    // --- 3. EVENT LISTENERS ---
    
    if (addFundsBtn) {
        addFundsBtn.addEventListener('click', () => {
            window.location.href = 'wallet.html';
        });
    }

    document.querySelectorAll('.feature-link').forEach(link => {
        link.addEventListener('click', (e) => {
            const feature = link.dataset.feature; 
            const target = link.getAttribute('href'); 

            if (target === '#') {
                 e.preventDefault(); 
                 alert(`⚠️ ${feature} is currently under construction!`);
                 return;
            }
            
            if (link.classList.contains('external-link')) return;

            if(!getSubscriptionStatusFromDOM()) {
                e.preventDefault();
                window.location.href = `subscription.html?redirect=${encodeURIComponent(feature)}`;
            }
        });
    });

    // --- 4. INITIAL CALLS ---
    updateUsernameUI();
    updateBalanceUI(); 
    updateSubscriptionStatus();
    refreshFeatureLocks(); 

    // 5. HANDLE AUTO-OPEN AFTER PURCHASE
    // This part assumes the redirection logic remains on the client side after a server-side success.
    (function autoOpenFeature(){
        const params = new URLSearchParams(location.search);
        // Check if status is success and subscription is active
        if(params.get('status') === 'success' && params.has('open') && getSubscriptionStatusFromDOM()){
            const feature = params.get('open');
            const link = document.querySelector(`.feature-link[data-feature="${feature}"]`);
            if(link) window.location.href = link.href;
        }
    })();
});