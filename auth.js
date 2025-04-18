/**
 * Authentication functionality for the Swimming Statistics Tracking website
 */

// Check if the user is logged in
function isUserLoggedIn() {
    return localStorage.getItem('isLoggedIn') === 'true';
}

// Get the logged-in user's email
function getUserEmail() {
    return localStorage.getItem('userEmail');
}

// Get user's name or email-based name
function getUserName() {
    const storedName = localStorage.getItem('userName');
    
    if (storedName) {
        return storedName;
    }
    
    // If name not stored, derive from email
    const email = getUserEmail();
    if (!email) return '';
    
    const emailParts = email.split('@');
    return emailParts[0].charAt(0).toUpperCase() + emailParts[0].slice(1);
}

// Get user's initial from their email or name
function getUserInitial() {
    const userName = localStorage.getItem('userName');
    
    if (userName) {
        return userName.charAt(0).toUpperCase();
    }
    
    const email = getUserEmail();
    if (!email) return '';
    
    const emailParts = email.split('@');
    return emailParts[0].charAt(0).toUpperCase();
}

// Update the authentication UI based on login status
function updateAuthUI() {
    const authContainer = document.getElementById('authContainer');
    if (!authContainer) return;
    
    if (isUserLoggedIn() && getUserEmail()) {
        // User is logged in, show profile icon
        const nameInitial = getUserInitial();
        authContainer.innerHTML = `<a href="profile.html" class="profile-icon" id="profileIcon">${nameInitial}</a>`;
    } else {
        // User is not logged in, show login button
        authContainer.innerHTML = '<a href="login.html" class="login-btn">LOGIN</a>';
    }
}

// Log the user in
function login(email, password) {
    // This now uses the database to validate credentials
    return new Promise((resolve, reject) => {
        if (typeof validateCredentials !== 'function') {
            // Database not loaded, fall back to simple check
            if (email && password) {
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('userEmail', email);
                resolve(true);
            } else {
                resolve(false);
            }
        } else {
            // Use database to validate credentials
            validateCredentials(email, password)
                .then(user => {
                    if (user) {
                        // Valid credentials, log the user in
                        localStorage.setItem('isLoggedIn', 'true');
                        localStorage.setItem('userEmail', user.email);
                        localStorage.setItem('userName', `${user.firstName} ${user.lastName}`);
                        
                        // Update last login timestamp
                        user.lastLogin = new Date().toISOString();
                        updateUser(user).catch(console.error);
                        
                        resolve(true);
                    } else {
                        // Invalid credentials
                        resolve(false);
                    }
                })
                .catch(error => {
                    console.error('Error during login:', error);
                    reject(error);
                });
        }
    });
}

// Log the user out
function logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    
    // Redirect to home page
    window.location.href = 'index.html';
}

// Check if user is on a protected page but not logged in
function checkAuthForProtectedPages() {
    // List of pages that require authentication
    const protectedPages = ['profile.html'];
    
    // Get current page filename
    const currentPage = window.location.pathname.split('/').pop();
    
    // If current page requires authentication and user is not logged in, redirect to login
    if (protectedPages.includes(currentPage) && !isUserLoggedIn()) {
        window.location.href = 'login.html';
    }
}

// Initialize auth functionality when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Update auth UI
    updateAuthUI();
    
    // Check if the current page requires authentication
    checkAuthForProtectedPages();
    
    // Add event listener to login form if it exists
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            login(email, password)
                .then(success => {
                    if (success) {
                        // Redirect to profile page after successful login
                        window.location.href = 'profile.html';
                    } else {
                        alert('Invalid email or password. Please try again.');
                    }
                })
                .catch(error => {
                    alert('An error occurred during login. Please try again.');
                    console.error('Login error:', error);
                });
        });
    }
    
    // Add event listener to logout button if it exists
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
});