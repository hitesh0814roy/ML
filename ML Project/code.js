
        // Page Navigation
        document.addEventListener('DOMContentLoaded', function() {
            const pages = document.querySelectorAll('.page');
            const navLinks = document.querySelectorAll('.nav-link');
            const loginBtn = document.getElementById('login-btn');
            const signupBtn = document.getElementById('signup-btn');
            const loginLink = document.getElementById('login-link');
            const signupLink = document.getElementById('signup-link');
            const logoutBtn = document.getElementById('logout-btn');
            
            // Show specific page and hide others
            function showPage(pageId) {
                pages.forEach(page => {
                    page.classList.add('hidden');
                });
                document.getElementById(pageId).classList.remove('hidden');
                
                // Update active nav link
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('data-page') === pageId) {
                        link.classList.add('active');
                    }
                });
            }
            
            // Navigation event listeners
            navLinks.forEach(link => {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    const pageId = this.getAttribute('data-page') + '-page';
                    showPage(pageId);
                });
            });
            
            // Button event listeners
            loginBtn.addEventListener('click', function() {
                showPage('login-page');
            });
            
            signupBtn.addEventListener('click', function() {
                showPage('signup-page');
            });
            
            loginLink.addEventListener('click', function(e) {
                e.preventDefault();
                showPage('login-page');
            });
            
            signupLink.addEventListener('click', function(e) {
                e.preventDefault();
                showPage('signup-page');
            });
            
            logoutBtn.addEventListener('click', function() {
                showPage('home-page');
            });
            
            // Form submissions
            document.getElementById('login-form').addEventListener('submit', function(e) {
                e.preventDefault();
                // In a real app, you would send this data to a backend
                const email = document.getElementById('login-email').value;
                const password = document.getElementById('login-password').value;
                
                // Simple validation
                if (email && password) {
                    // Simulate successful login
                    showPage('dashboard');
                    alert('Login successful!');
                } else {
                    alert('Please fill in all fields');
                }
            });
            
            document.getElementById('signup-form').addEventListener('submit', function(e) {
                e.preventDefault();
                // In a real app, you would send this data to a backend
                const name = document.getElementById('signup-name').value;
                const email = document.getElementById('signup-email').value;
                const password = document.getElementById('signup-password').value;
                const confirmPassword = document.getElementById('signup-confirm').value;
                
                // Simple validation
                if (name && email && password && confirmPassword) {
                    if (password !== confirmPassword) {
                        alert('Passwords do not match');
                        return;
                    }
                    
                    // Simulate successful signup
                    showPage('dashboard');
                    alert('Account created successfully!');
                } else {
                    alert('Please fill in all fields');
                }
            });
            
            document.getElementById('contact-form').addEventListener('submit', function(e) {
                e.preventDefault();
                // In a real app, you would send this data to a backend
                const name = document.getElementById('contact-name').value;
                const email = document.getElementById('contact-email').value;
                const subject = document.getElementById('contact-subject').value;
                const message = document.getElementById('contact-message').value;
                
                // Simple validation
                if (name && email && subject && message) {
                    // Simulate successful message submission
                    alert('Message sent successfully! We will get back to you soon.');
                    document.getElementById('contact-form').reset();
                } else {
                    alert('Please fill in all fields');
                }
            });
            
            // Initialize with home page
            showPage('home-page');
        });