document.addEventListener('DOMContentLoaded', function() {
    const settingsForm = document.querySelector('#settingsForm');
    const changePasswordForm = document.querySelector('#changePasswordForm');

    // Fetch user information and populate the form
    async function fetchUserInfo() {
        try {
            const response = await fetch('/settings/user-info');
            if (!response.ok) {
                throw new Error('Failed to fetch user information');
            }
            const data = await response.json();
            if (data.success) {
                const user = data.data;
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
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error fetching user information:', error.message);
        }
    }

    // Call fetchUserInfo on page load
    fetchUserInfo();

    // Function to update CSRF token in forms
    function updateCsrfToken(token) {
        const csrfInputs = document.querySelectorAll('input[name="_csrf"]');
        csrfInputs.forEach(input => input.value = token);
        console.log('CSRF token updated');
    }

    // Handle user information form submission
    if (settingsForm) {
        settingsForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(this);
            fetch('/settings', {
                method: 'POST',
                body: formData,
                credentials: 'include',
                headers: {
                    'CSRF-Token': formData.get('_csrf') // Ensure CSRF token is included in the request headers
                }
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to save settings');
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    alert('Settings saved successfully.');
                    // Update CSRF token if a new one is provided
                    if (data.csrfToken) {
                        updateCsrfToken(data.csrfToken);
                    }
                } else {
                    alert('Failed to save settings.');
                }
            })
            .catch(error => {
                console.error('Error saving settings:', error);
                alert('Error saving settings.');
            });
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

            const formData = new FormData(this);
            fetch('/settings/change-password', {
                method: 'POST',
                body: formData,
                credentials: 'include',
                headers: {
                    'CSRF-Token': formData.get('_csrf') // Ensure CSRF token is included in the request headers
                }
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to change password');
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    alert('Password changed successfully.');
                    // Update CSRF token if a new one is provided
                    if (data.csrfToken) {
                        updateCsrfToken(data.csrfToken);
                    }
                } else {
                    alert('Failed to change password.');
                }
            })
            .catch(error => {
                console.error('Error changing password:', error);
                alert('Error changing password.');
            });
        });
    }
});
