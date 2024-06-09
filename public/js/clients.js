document.addEventListener('DOMContentLoaded', function() {
    const clientSearchInput = document.getElementById('clientSearch');
    const clientResultsContainer = document.getElementById('clientResults');

    clientSearchInput.addEventListener('input', async function() {
        const query = this.value.trim();
        if (query.length > 2) {
            try {
                const response = await axios.get(`/clients/search?query=${query}`);
                const clients = response.data.data;
                clientResultsContainer.innerHTML = '';
                clients.forEach(client => {
                    const clientElement = document.createElement('a');
                    clientElement.className = 'list-group-item list-group-item-action';
                    clientElement.href = `/clients/${client._id}/profile`;
                    clientElement.textContent = client.name;
                    clientResultsContainer.appendChild(clientElement);
                });
            } catch (error) {
                console.error('Error fetching clients:', error);
            }
        } else {
            clientResultsContainer.innerHTML = '';
        }
    });

    document.querySelectorAll('.remove-client').forEach(button => {
        button.addEventListener('click', async function() {
            const clientId = this.dataset.clientId;
            try {
                await axios.delete(`/clients/${clientId}`);
                window.location.reload();
            } catch (error) {
                console.error('Error deleting client:', error);
            }
        });
    });
});
