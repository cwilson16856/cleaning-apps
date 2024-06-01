document.addEventListener('DOMContentLoaded', function() {
    const clientSearchInput = document.getElementById('clientSearch');
    const clientResults = document.getElementById('clientResults');
    const clientIdInput = document.getElementById('clientId');
    const clientNameInput = document.getElementById('clientName');
    const clientEmailInput = document.getElementById('clientEmail');
    const clientPhoneInput = document.getElementById('clientPhone');
    const clientAddressInput = document.getElementById('clientAddress');
    const clientPreview = document.getElementById('clientPreview');
    const clientNamePreview = document.getElementById('clientNamePreview');
    const clientEmailPreview = document.getElementById('clientEmailPreview');
    const clientPhonePreview = document.getElementById('clientPhonePreview');
    const clientAddressPreview = document.getElementById('clientAddressPreview');
    const removeClientBtn = document.getElementById('removeClientBtn');
    const editClientBtn = document.getElementById('editClientBtn');
    const serviceTypeSelect = document.getElementById('serviceType');
    const frequencyDiv = document.getElementById('frequencyDiv');
    const initialCleaningDiv = document.getElementById('initialCleaningDiv');

    // Function to toggle visibility of additional options based on service type
    function toggleServiceOptions() {
        const serviceType = serviceTypeSelect.value;
        if (serviceType === 'Recurring') {
            frequencyDiv.classList.remove('d-none');
            initialCleaningDiv.classList.add('d-none');
        } else if (serviceType === 'One-Time Deep Clean' || serviceType === 'Move In/Move Out') {
            frequencyDiv.classList.add('d-none');
            initialCleaningDiv.classList.remove('d-none');
        } else {
            frequencyDiv.classList.add('d-none');
            initialCleaningDiv.classList.add('d-none');
        }
    }

    // Function to hide the dropdown
    function hideDropdown() {
        clientResults.innerHTML = '';
    }

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
                            clientItem.addEventListener('click', function(event) {
                                event.preventDefault();
                                clientSearchInput.value = client.name;
                                if (clientIdInput) clientIdInput.value = client._id;
                                if (clientNameInput) clientNameInput.value = client.name;
                                if (clientEmailInput) clientEmailInput.value = client.email;
                                if (clientPhoneInput) clientPhoneInput.value = client.phoneNumber;
                                if (clientAddressInput) clientAddressInput.value = `${client.streetAddress}, ${client.city}, ${client.state}, ${client.zip}`;
                                if (clientNamePreview) clientNamePreview.textContent = client.name;
                                if (clientEmailPreview) clientEmailPreview.textContent = client.email;
                                if (clientPhonePreview) clientPhonePreview.textContent = client.phoneNumber;
                                if (clientAddressPreview) clientAddressPreview.textContent = `${client.streetAddress}, ${client.city}, ${client.state}, ${client.zip}`;
                                if (clientPreview) clientPreview.classList.remove('d-none');
                                hideDropdown();
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
                    if (clientIdInput) clientIdInput.value = newClient.data._id;
                    if (clientNameInput) clientNameInput.value = newClient.data.name;
                    if (clientEmailInput) clientEmailInput.value = newClient.data.email;
                    if (clientPhoneInput) clientPhoneInput.value = newClient.data.phoneNumber;
                    if (clientAddressInput) clientAddressInput.value = `${newClient.data.streetAddress}, ${newClient.data.city}, ${newClient.data.state}, ${newClient.data.zip}`;
                    if (clientNamePreview) clientNamePreview.textContent = newClient.data.name;
                    if (clientEmailPreview) clientEmailPreview.textContent = newClient.data.email;
                    if (clientPhonePreview) clientPhonePreview.textContent = newClient.data.phoneNumber;
                    if (clientAddressPreview) clientAddressPreview.textContent = `${newClient.data.streetAddress}, ${newClient.data.city}, ${newClient.data.state}, ${newClient.data.zip}`;
                    clientResults.innerHTML = '';
                    if (clientPreview) clientPreview.classList.remove('d-none');
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
                if (clientIdInput) clientIdInput.value = '';
                if (clientNameInput) clientNameInput.value = '';
                if (clientEmailInput) clientEmailInput.value = '';
                if (clientPhoneInput) clientPhoneInput.value = '';
                if (clientAddressInput) clientAddressInput.value = '';
                clientSearchInput.value = '';
                if (clientNamePreview) clientNamePreview.textContent = '';
                if (clientEmailPreview) clientEmailPreview.textContent = '';
                if (clientPhonePreview) clientPhonePreview.textContent = '';
                if (clientAddressPreview) clientAddressPreview.textContent = '';
                if (clientPreview) clientPreview.classList.add('d-none');
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
                    if (clientIdInput) clientIdInput.value = updatedClient.data._id;
                    if (clientNameInput) clientNameInput.value = updatedClient.data.name;
                    if (clientEmailInput) clientEmailInput.value = updatedClient.data.email;
                    if (clientPhoneInput) clientPhoneInput.value = updatedClient.data.phoneNumber;
                    if (clientAddressInput) clientAddressInput.value = `${updatedClient.data.streetAddress}, ${updatedClient.data.city}, ${updatedClient.data.state}, ${updatedClient.data.zip}`;
                    if (clientNamePreview) clientNamePreview.textContent = updatedClient.data.name;
                    if (clientEmailPreview) clientEmailPreview.textContent = updatedClient.data.email;
                    if (clientPhonePreview) clientPhonePreview.textContent = updatedClient.data.phoneNumber;
                    if (clientAddressPreview) clientAddressPreview.textContent = `${updatedClient.data.streetAddress}, ${updatedClient.data.city}, ${updatedClient.data.state}, ${updatedClient.data.zip}`;
                    clientResults.innerHTML = '';
                    if (clientPreview) clientPreview.classList.remove('d-none');
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

    // Add event listener for service type selection changes
    if (serviceTypeSelect) {
        serviceTypeSelect.addEventListener('change', toggleServiceOptions);
        toggleServiceOptions(); // Call on page load to set the correct initial state
    }
});
