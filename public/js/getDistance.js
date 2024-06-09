document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('calculateDistanceBtn').addEventListener('click', async () => {
        const clientId = document.getElementById('clientId').value;
        const userAddress = document.getElementById('userAddress').value;
        const csrfToken = document.querySelector('input[name="_csrf"]').value;

        try {
            const response = await axios.post('/quotes/calculate-distance', { clientId, userAddress }, {
                headers: {
                    'CSRF-Token': csrfToken
                }
            });
            document.getElementById('distance').value = response.data.distance;
        } catch (error) {
            console.error('Error calculating distance:', error);
            alert('Failed to calculate distance. Please try again.');
        }
    }); // This closes the callback function
}); // This closes the DOMContentLoaded listener