document.addEventListener('DOMContentLoaded', function() {
    const settingsForm = document.querySelector('#settingsForm');
    const changePasswordForm = document.querySelector('#changePasswordForm');

    // Fetch user information and populate the form
    let userCache = null;
    async function fetchUserInfo() {
        try {
            if (userCache) {
                return userCache;
            }
            const response = await fetch('/settings/user-info');
            if (!response.ok) {
                throw new Error('Failed to fetch user information');
            }
            const data = await response.json();
            if (data.success) {
                userCache = data.data;
                populateForm(userCache);
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error fetching user information:', error.message);
        }
    }

    function populateForm(user) {
        document.querySelector('#businessName').value = user.businessName || '';
        document.querySelector('#name').value = user.name || '';
        document.querySelector('#phoneNumber').value = user.phoneNumber || '';
        document.querySelector('#email').value = user.email || '';
        document.querySelector('#streetAddress').value = user.streetAddress || '';
        document.querySelector('#city').value = user.city || '';
        document.querySelector('#state').value = user.state || '';
        document.querySelector('#zipCode').value = user.zipCode || '';
        document.querySelector('#websiteURL').value = user.websiteURL || '';
        document.querySelector('#socialMediaLinks').value = user.socialMediaLinks || '';

        const hoursOfOperation = user.hoursOfOperation || {};
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        days.forEach(day => {
            document.querySelector(`#${day}From`).value = hoursOfOperation[day]?.from || '';
            document.querySelector(`#${day}To`).value = hoursOfOperation[day]?.to || '';
        });
    }

    // Call fetchUserInfo on page load
    fetchUserInfo();

    // Function to update CSRF token in forms
    function updateCsrfToken(token) {
        const csrfInputs = document.querySelectorAll('input[name="_csrf"]');
        csrfInputs.forEach(input => input.value = token);
        console.log('CSRF token updated');
    }

    // Function to handle form submission
    async function handleFormSubmission(url, formData) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                body: formData,
                credentials: 'include',
                headers: {
                    'CSRF-Token': formData.get('_csrf') // Ensure CSRF token is included in the request headers
                }
            });

            if (!response.ok) {
                throw new Error('Request failed');
            }

            const data = await response.json();

            if (data.success) {
                alert('Operation completed successfully.');
                // Update CSRF token if a new one is provided
                if (data.csrfToken) {
                    updateCsrfToken(data.csrfToken);
                }
            } else {
                alert(data.message || 'Operation failed.');
            }
        } catch (error) {
            console.error('Error:', error.message);
            alert('An unexpected error occurred. Please try again later.');
        }
    }

    // Sanitize input to prevent XSS attacks
    function sanitizeInput(input) {
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(input));
        return div.innerHTML;
    }

    function sanitizeFormData(formData) {
        for (let [key, value] of formData.entries()) {
            formData.set(key, sanitizeInput(value));
        }
        return formData;
    }

    // Validate settings form
    function validateSettingsForm(formData) {
        let isValid = true;

        // Example validation for email
        const email = formData.get('email');
        if (!email.includes('@')) {
            isValid = false;
            document.querySelector('#email').classList.add('invalid');
            alert('Please provide a valid email address.');
        }

        return isValid;
    }

    // Handle user information form submission
    if (settingsForm) {
        settingsForm.addEventListener('submit', function(e) {
            e.preventDefault();
            let formData = new FormData(this);
            formData = sanitizeFormData(formData);
            if (validateSettingsForm(formData)) {
                handleFormSubmission('/settings', formData);
            }
        });
    }

    // Handle password change form submission
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', function(e) {
            const newPassword = document.querySelector('#newPassword').value;
            const confirmNewPassword = document.querySelector('#confirmNewPassword').value;

            if (newPassword !== confirmNewPassword) {
                e.preventDefault();
                alert('New passwords do not match.');
                return;
            }

            let formData = new FormData(this);
            formData = sanitizeFormData(formData);
            handleFormSubmission('/settings/change-password', formData);
        });
    }
});
