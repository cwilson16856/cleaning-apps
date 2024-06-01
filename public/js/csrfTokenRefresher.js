const updateCsrfToken = (newToken) => {
    const csrfInputs = document.querySelectorAll('input[name="_csrf"]');
    csrfInputs.forEach(input => {
        input.value = newToken;
    });
};

const fetchDataWithCsrfUpdate = async (url) => {
    const response = await fetch(url, { credentials: 'same-origin' });
    const data = await response.json();
    if (data.csrfToken) {
        updateCsrfToken(data.csrfToken);
    }
    return data;
};

// Example usage
fetchDataWithCsrfUpdate('/some-endpoint').then(data => {
    console.log('Data fetched with CSRF token update:', data);
});