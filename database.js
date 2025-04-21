/**
 * Database functionality for the Swimming Statistics Tracking website
 * Uses IndexedDB to store user data locally in the browser
 */

// Database variables
const DB_NAME = 'SwimmingStatsDB';
const DB_VERSION = 1;
const USER_STORE = 'users';
let db;

// Initialize the database
function initDB() {
    return new Promise((resolve, reject) => {
        // Open the database
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        // Handle database upgrade (called when the database is created or version is changed)
        request.onupgradeneeded = (event) => {
            db = event.target.result;
            console.log('Database upgrade needed');
            
            // Create the users object store if it doesn't exist
            if (!db.objectStoreNames.contains(USER_STORE)) {
                const userStore = db.createObjectStore(USER_STORE, { keyPath: 'email' });
                // Create indexes for faster queries
                userStore.createIndex('email', 'email', { unique: true });
                userStore.createIndex('firstName', 'firstName', { unique: false });
                userStore.createIndex('lastName', 'lastName', { unique: false });
                userStore.createIndex('dob', 'dob', { unique: false });
                console.log('Users store created');
            }
        };
        
        // Handle database open success
        request.onsuccess = (event) => {
            db = event.target.result;
            console.log('Database initialized successfully');
            resolve(db);
        };
        
        // Handle database open error
        request.onerror = (event) => {
            console.error('Error opening database:', event.target.error);
            reject(event.target.error);
        };
    });
}

// Add a new user to the database
function addUser(userData) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject(new Error('Database not initialized'));
            return;
        }
        
        // Start a transaction
        const transaction = db.transaction([USER_STORE], 'readwrite');
        const userStore = transaction.objectStore(USER_STORE);
        
        // Check if user already exists
        const getRequest = userStore.get(userData.email);
        
        getRequest.onsuccess = (event) => {
            if (event.target.result) {
                // User already exists
                reject(new Error('User with this email already exists'));
                return;
            }
            
            // Add the new user
            const addRequest = userStore.add(userData);
            
            addRequest.onsuccess = () => {
                console.log('User added successfully');
                resolve(userData);
            };
            
            addRequest.onerror = (event) => {
                console.error('Error adding user:', event.target.error);
                reject(event.target.error);
            };
        };
        
        getRequest.onerror = (event) => {
            console.error('Error checking if user exists:', event.target.error);
            reject(event.target.error);
        };
    });
}

// Get a user by email
function getUserByEmail(email) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject(new Error('Database not initialized'));
            return;
        }
        
        // Start a transaction
        const transaction = db.transaction([USER_STORE], 'readonly');
        const userStore = transaction.objectStore(USER_STORE);
        
        // Get the user
        const request = userStore.get(email);
        
        request.onsuccess = (event) => {
            const user = event.target.result;
            if (user) {
                resolve(user);
            } else {
                resolve(null); // User not found
            }
        };
        
        request.onerror = (event) => {
            console.error('Error getting user:', event.target.error);
            reject(event.target.error);
        };
    });
}

// Validate user credentials
function validateCredentials(email, password) {
    return new Promise((resolve, reject) => {
        getUserByEmail(email)
            .then(user => {
                if (user && user.password === password) {
                    // Credentials are valid
                    resolve(user);
                } else {
                    // Credentials are invalid
                    resolve(null);
                }
            })
            .catch(error => {
                console.error('Error validating credentials:', error);
                reject(error);
            });
    });
}

// Update a user's information
function updateUser(userData) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject(new Error('Database not initialized'));
            return;
        }
        
        // Start a transaction
        const transaction = db.transaction([USER_STORE], 'readwrite');
        const userStore = transaction.objectStore(USER_STORE);
        
        // Update the user
        const request = userStore.put(userData);
        
        request.onsuccess = () => {
            console.log('User updated successfully');
            resolve(userData);
        };
        
        request.onerror = (event) => {
            console.error('Error updating user:', event.target.error);
            reject(event.target.error);
        };
    });
}

// Get all users (for admin purposes)
function getAllUsers() {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject(new Error('Database not initialized'));
            return;
        }
        
        // Start a transaction
        const transaction = db.transaction([USER_STORE], 'readonly');
        const userStore = transaction.objectStore(USER_STORE);
        
        // Get all users
        const request = userStore.getAll();
        
        request.onsuccess = (event) => {
            resolve(event.target.result);
        };
        
        request.onerror = (event) => {
            console.error('Error getting all users:', event.target.error);
            reject(event.target.error);
        };
    });
}

// Delete a user by email
function deleteUser(email) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject(new Error('Database not initialized'));
            return;
        }
        
        // Start a transaction
        const transaction = db.transaction([USER_STORE], 'readwrite');
        const userStore = transaction.objectStore(USER_STORE);
        
        // Delete the user
        const request = userStore.delete(email);
        
        request.onsuccess = () => {
            console.log('User deleted successfully');
            resolve(true);
        };
        
        request.onerror = (event) => {
            console.error('Error deleting user:', event.target.error);
            reject(event.target.error);
        };
    });
}

// Initialize the database when the script is loaded
document.addEventListener('DOMContentLoaded', () => {
    initDB()
        .then(() => {
            console.log('Database ready');
            
            // Handle signup form if it exists
            const signupForm = document.getElementById('signupForm');
            if (signupForm) {
                signupForm.addEventListener('submit', handleSignup);
            }
        })
        .catch(error => {
            console.error('Database initialization failed:', error);
        });
});

// Handle signup form submission
function handleSignup(event) {
    event.preventDefault();
    
    // Get form data
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const dob = document.getElementById('dob').value;
    
    // Validate form data
    if (!firstName || !lastName || !email || !password || !dob) {
        alert('Please fill in all required fields');
        return;
    }
    
    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }
    
    // Create user object
    const user = {
        firstName,
        lastName,
        email,
        password, // In a real app, you would hash the password
        dob,
        registrationDate: new Date().toISOString(),
        lastLogin: new Date().toISOString()
    };
    
    // Add user to database
    addUser(user)
        .then(user => {
            console.log('User registered successfully:', user);
            
            // Log the user in
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('userEmail', user.email);
            localStorage.setItem('userName', `${user.firstName} ${user.lastName}`);
            localStorage.setItem('userDob', user.dob);
            
            // Redirect to profile page
            window.location.href = 'profile.html';
        })
        .catch(error => {
            if (error.message === 'User with this email already exists') {
                alert('An account with this email already exists. Please use a different email or log in.');
            } else {
                alert('Error creating account. Please try again.');
                console.error('Error creating account:', error);
            }
        });
}