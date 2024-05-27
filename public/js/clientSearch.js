document.addEventListener('DOMContentLoaded', function() {
    const clientSearchInput = document.getElementById('clientSearch');
    const clientResults = document.getElementById('clientResults');
    const clientIdInput = document.getElementById('clientId');

    clientSearchInput.addEventListener('input', async function() {
        const query = clientSearchInput.value.trim();
        if (query.length > 2) {
            try {
                const response = await fetch(`/clients/search?query=${query}`);
                const clients = await response.json();
                clientResults.innerHTML = '';
                if (clients.length > 0) {
                    clients.forEach(client => {
                        const clientItem = document.createElement('a');
                        clientItem.href = '#';
                        clientItem.className = 'list-group-item list-group-item-action';
                        clientItem.textContent = client.name;
                        clientItem.addEventListener('click', function() {
                            clientSearchInput.value = client.name;
                            clientIdInput.value = client._id;
                            clientResults.innerHTML = '';
                        });
                        clientResults.appendChild(clientItem);
                    });
                } else {
                    const noResults = document.createElement('div');
                    noResults.className = 'list-group-item';
                    noResults.textContent = 'No clients found. Would you like to ';
                    const createLink = document.createElement('a');
                    createLink.href = '#';
                    createLink.textContent = 'create a new client?';
                    createLink.addEventListener('click', function() {
                        const createClientModal = new bootstrap.Modal(document.getElementById('createClientModal'));
                        createClientModal.show();
                    });
                    noResults.appendChild(createLink);
                    clientResults.appendChild(noResults);
                }
            } catch (error) {
                console.error('Error fetching clients:', error);
            }
        } else {
            clientResults.innerHTML = '';
        }
    });

    const createClientForm = document.getElementById('createClientForm');
    createClientForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        const formData = new FormData(createClientForm);
        const data = {};
        formData.forEach((value, key) => {
            data[key] = value;
        });

        try {
            const response = await fetch('/clients', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'CSRF-Token': data._csrf
                },
                body: JSON.stringify(data)
            });
            const newClient = await response.json();
            if (newClient.success) {
                clientSearchInput.value = newClient.data.name;
                clientIdInput.value = newClient.data._id;
                clientResults.innerHTML = '';
                const createClientModal = bootstrap.Modal.getInstance(document.getElementById('createClientModal'));
                createClientModal.hide();
            } else {
                console.error('Failed to create client:', newClient.error);
            }
        } catch (error) {
            console.error('Error creating client:', error);
        }
    });
});
