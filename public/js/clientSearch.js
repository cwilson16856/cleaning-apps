document.addEventListener('DOMContentLoaded', function() {
    const clientSearchInput = document.getElementById('clientSearch');
    const clientResults = document.getElementById('clientResults');
    const clientIdInput = document.getElementById('clientId');
    const clientPreview = document.getElementById('clientPreview');
    const clientNamePreview = document.getElementById('clientNamePreview');
    const clientEmailPreview = document.getElementById('clientEmailPreview');
    const clientPhonePreview = document.getElementById('clientPhonePreview');
    const clientAddressPreview = document.getElementById('clientAddressPreview'); // Added for displaying client address
    const removeClientBtn = document.getElementById('removeClientBtn');
    const editClientBtn = document.getElementById('editClientBtn');

    // Add event listener for the client search input
    if (clientSearchInput) {
        clientSearchInput.addEventListener('input', async function() {
            const query = clientSearchInput.value.trim();
            if (query.length > 2) {
                try {
                    const response = await fetch(`/clients/search?query=${query}`, { cache: 'no-store' });
                    if (!response.ok) throw new Error('Network response was not ok');
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
                                clientNamePreview.textContent = client.name;
                                clientEmailPreview.textContent = client.email;
                                clientPhonePreview.textContent = client.phoneNumber;
                                clientAddressPreview.textContent = `${client.streetAddress}, ${client.city}, ${client.state}, ${client.zip}`; // Displaying client address
                                clientPreview.classList.remove('d-none');
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
                    clientResults.innerHTML = '<div class="list-group-item">Error fetching clients. Please try again later.</div>';
                }
            } else {
                clientResults.innerHTML = '';
            }
        });
    }

    // Event listener for creating a client
    const createClientForm = document.getElementById('createClientForm');
    if (createClientForm) {
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
                if (!response.ok) throw new Error('Network response was not ok');
                const newClient = await response.json();
                if (newClient.success) {
                    clientSearchInput.value = newClient.data.name;
                    clientIdInput.value = newClient.data._id;
                    clientNamePreview.textContent = newClient.data.name;
                    clientEmailPreview.textContent = newClient.data.email;
                    clientPhonePreview.textContent = newClient.data.phoneNumber;
                    clientAddressPreview.textContent = `${newClient.data.streetAddress}, ${newClient.data.city}, ${newClient.data.state}, ${newClient.data.zip}`; // Displaying client address
                    clientResults.innerHTML = '';
                    clientPreview.classList.remove('d-none');
                    const createClientModal = bootstrap.Modal.getInstance(document.getElementById('createClientModal'));
                    createClientModal.hide();
                } else {
                    console.error('Failed to create client:', newClient.error);
                    alert('Failed to create client. Please try again.');
                }
            } catch (error) {
                console.error('Error creating client:', error);
                alert('Error creating client. Please try again.');
            }
        });
    }

    // Event listener for removing a client
    if (removeClientBtn) {
        removeClientBtn.addEventListener('click', function(event) {
            event.preventDefault();
            if (confirm('Are you sure you want to remove this client from the quote?')) {
                clientIdInput.value = '';
                clientSearchInput.value = '';
                clientNamePreview.textContent = '';
                clientEmailPreview.textContent = '';
                clientPhonePreview.textContent = '';
                clientAddressPreview.textContent = ''; // Clearing client address
                clientPreview.classList.add('d-none');
            }
        });
    }

    // Event listener for editing a client
    if (editClientBtn) {
        editClientBtn.addEventListener('click', async function(event) {
            event.preventDefault();
            const clientId = clientIdInput.value;
            if (clientId) {
                try {
                    const response = await fetch(`/clients/${clientId}`, { cache: 'no-store' });
                    if (!response.ok) throw new Error('Network response was not ok');
                    const client = await response.json();

                    // Fill the edit form with client data
                    document.getElementById('editClientId').value = client._id;
                    document.getElementById('editClientName').value = client.name;
                    document.getElementById('editClientEmail').value = client.email;
                    document.getElementById('editClientPhoneNumber').value = client.phoneNumber;
                    document.getElementById('editClientStreetAddress').value = client.streetAddress;
                    document.getElementById('editClientCity').value = client.city;
                    document.getElementById('editClientState').value = client.state;
                    document.getElementById('editClientZip').value = client.zip;

                    // Show the edit client modal
                    const editClientModal = new bootstrap.Modal(document.getElementById('editClientModal'));
                    editClientModal.show();
                } catch (error) {
                    console.error('Error fetching client for edit:', error);
                    alert('Error fetching client data. Please try again.');
                }
            }
        });
    }

    // Event listener for submitting the edit client form
    const editClientForm = document.getElementById('editClientForm');
    if (editClientForm) {
        editClientForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            const formData = new FormData(editClientForm);
            const data = {};
            formData.forEach((value, key) => {
                data[key] = value;
            });

            try {
                const response = await fetch(`/clients/${data.clientId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'CSRF-Token': data._csrf
                    },
                    body: JSON.stringify(data)
                });
                if (!response.ok) throw new Error('Network response was not ok');
                const updatedClient = await response.json();
                if (updatedClient.success) {
                    clientSearchInput.value = updatedClient.data.name;
                    clientIdInput.value = updatedClient.data._id;
                    clientNamePreview.textContent = updatedClient.data.name;
                    clientEmailPreview.textContent = updatedClient.data.email;
                    clientPhonePreview.textContent = updatedClient.data.phoneNumber;
                    clientAddressPreview.textContent = `${updatedClient.data.streetAddress}, ${updatedClient.data.city}, ${updatedClient.data.state}, ${updatedClient.data.zip}`; // Displaying updated client address
                    clientResults.innerHTML = '';
                    clientPreview.classList.remove('d-none');
                    const editClientModal = bootstrap.Modal.getInstance(document.getElementById('editClientModal'));
                    editClientModal.hide();
                } else {
                    console.error('Failed to update client:', updatedClient.error);
                    alert('Failed to update client. Please try again.');
                }
            } catch (error) {
                console.error('Error updating client:', error);
                alert('Error updating client. Please try again.');
            }
        });
    }
});