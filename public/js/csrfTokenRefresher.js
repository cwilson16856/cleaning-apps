document.addEventListener('DOMContentLoaded', function() {
    // Function to update CSRF token in all forms
    const updateCsrfToken = (newToken) => {
        const csrfInputs = document.querySelectorAll('input[name="_csrf"]');
        csrfInputs.forEach(input => {
            input.value = newToken;
        });
        console.log('CSRF token updated');
    };

    // Function to handle the AJAX response and update CSRF token
    const handleAjaxResponse = (response) => {
        if(response.csrfToken) {
            updateCsrfToken(response.csrfToken);
        }
    };

    // Enhanced AJAX request function that includes CSRF token update logic
    const fetchDataWithCsrfUpdate = (endpoint) => {
        fetch(endpoint, {
            method: 'GET',
            credentials: 'include' // Necessary to include cookies
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(handleAjaxResponse)
        .catch(error => {
            console.error('Error fetching new CSRF token:', error);
            console.error(error.stack);
        });
    };

    // Example usage of the enhanced AJAX request function
    // Replace '/some-endpoint-that-returns-csrf' with actual endpoints in your application
    // fetchDataWithCsrfUpdate('/some-endpoint-that-returns-csrf');

    // Optionally, you can set up a global AJAX handler to automatically call fetchDataWithCsrfUpdate
    // after each AJAX request that might change the CSRF token, ensuring all forms in the application
    // always have the latest CSRF token.
});
