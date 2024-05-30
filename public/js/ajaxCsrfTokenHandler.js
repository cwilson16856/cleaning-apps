document.addEventListener('DOMContentLoaded', function() {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(event) {
            event.preventDefault();
            const formData = new FormData(form);
            const url = form.action;
            const method = form.method;
            const csrfToken = formData.get('_csrf');
            fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'CSRF-Token': csrfToken // Ensure CSRF token is sent in the header for validation
                },
                body: JSON.stringify(Object.fromEntries(formData)),
                credentials: 'include' // Necessary for cookies to be sent with the request
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                console.log('Form submission successful', data);
                // Update CSRF token in the form to the new one provided by the server
                const newCsrfToken = data.csrfToken; // Assuming the server sends back a new CSRF token
                if (newCsrfToken) {
                    const csrfInputField = form.querySelector('input[name="_csrf"]');
                    if (csrfInputField) {
                        csrfInputField.value = newCsrfToken;
                    }
                }
                // Handle form submission success, e.g., redirecting to another page or showing a success message
            })
            .catch(error => {
                console.error('Error during form submission:', error);
                // Handle form submission error, e.g., showing an error message to the user
            });
        });
    });
});