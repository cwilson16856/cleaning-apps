document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('form');

    if (form) {
        form.addEventListener('submit', function(event) {
            event.preventDefault();
            const formData = new FormData(form);
            const data = {};
            formData.forEach((value, key) => {
                data[key] = value;
            });

            console.log('Form Data:', data);  // Log form data for debugging

            fetch(form.action, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'CSRF-Token': data._csrf  // Include CSRF token in headers
                },
                body: JSON.stringify(data)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(result => {
                console.log('Success:', result);
                // Determine the redirect URL based on the current page or context
                let redirectUrl = '/items';
                if (window.location.pathname.includes('/clients')) {
                    redirectUrl = '/clients';
                } else if (window.location.pathname.includes('/quotes')) {
                    redirectUrl = '/quotes';
                }
                window.location.href = redirectUrl;  // Redirect based on context
            })
            .catch(error => {
                console.error('Failed to submit form:', error);
                alert('Failed to submit form. Please try again.');
            });
        });
    }
});
