document.addEventListener('DOMContentLoaded', () => {

    const settingsForm = document.querySelector('#settingsForm');
    const changePasswordForm = document.querySelector('#changePasswordForm');
    let userCache = null;
    let csrfToken = null;

    // Cache commonly queried elements
    const emailInput = document.querySelector('#email');
    const newPasswordInput = document.querySelector('#newPassword');
    const confirmNewPasswordInput = document.querySelector('#confirmNewPassword');

    // Initialize Bootstrap tabs
    const triggerTabList = [].slice.call(document.querySelectorAll('a[data-bs-toggle="tab"]'));
    triggerTabList.forEach((triggerEl) => {
        const tabTrigger = new bootstrap.Tab(triggerEl);
        triggerEl.addEventListener('click', function (event) {
            event.preventDefault();
            tabTrigger.show();
        });
    });

    const fetchUserInfo = async () => {
        try {
            if (userCache) return userCache;
            const response = await fetch('/settings/user-info');
            if (!response.ok) throw new Error('Failed to fetch user information');
            const data = await response.json();
            if (data.success) {
                userCache = data.data;
                populateForm(userCache);
                csrfToken = data.csrfToken;
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error fetching user information:', error.message);
            alert('Unable to fetch user information. Please try again later.');
        }
    }

    const populateForm = (user) => {
        // Populate form fields with user data
        document.querySelector('#businessName').value = user.businessName || '';
        document.querySelector('#name').value = user.name || '';
        document.querySelector('#phoneNumber').value = user.phoneNumber || '';
        emailInput.value = user.email || '';
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

    const updateCsrfToken = (token) => {
        csrfToken = token;
    }

    const handleFormSubmission = async (url, formData) => {
        try {
            const response = await fetch(url, {
                method: 'POST',
                body: formData,
                credentials: 'include',
                headers: {
                    'CSRF-Token': csrfToken
                }
            });

            if (!response.ok) throw new Error('Request failed');
            const data = await response.json();

            if (data.success) {
                alert('Operation completed successfully.');
                if (data.csrfToken) updateCsrfToken(data.csrfToken);
                fetchUserInfo(); // Re-fetch user info to update form
            } else {
                alert(data.message || 'Operation failed.');
            }
        } catch (error) {
            console.error('Error:', error.message);
            alert('An unexpected error occurred. Please try again later.');
        }
    }

    const sanitizeInput = (input) => {
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(input));
        return div.innerHTML;
    }

    const sanitizeFormData = (formData) => {
        for (let [key, value] of formData.entries()) {
            formData.set(key, sanitizeInput(value));
        }
        return formData;
    }

    const validateSettingsForm = (formData) => {
        const email = formData.get('email');
        if (!email.includes('@')) {
            emailInput.classList.add('invalid');
            alert('Please provide a valid email address.');
            return false;
        }
        return true;
    }

    if (settingsForm) {
        settingsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            let formData = new FormData(e.target);
            formData = sanitizeFormData(formData);
            if (validateSettingsForm(formData)) {
                handleFormSubmission('/settings', formData);
            }
        });
    }

    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const newPassword = newPasswordInput.value;
            const confirmNewPassword = confirmNewPasswordInput.value;

            if (newPassword !== confirmNewPassword) {
                alert('New passwords do not match.');
                return;
            }

            let formData = new FormData(e.target);
            formData = sanitizeFormData(formData);
            handleFormSubmission('/settings/change-password', formData);
        });
    }

    fetchUserInfo();
});