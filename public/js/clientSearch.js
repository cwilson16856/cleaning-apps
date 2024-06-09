document.addEventListener('DOMContentLoaded', function() {
    const elements = {
        clientSearchInput: document.getElementById('clientSearch'),
        clientResults: document.getElementById('clientResults'),
        clientIdInput: document.getElementById('clientId'),
        clientNameInput: document.getElementById('clientName'),
        clientEmailInput: document.getElementById('clientEmail'),
        clientPhoneInput: document.getElementById('clientPhone'),
        clientAddressInput: document.getElementById('clientAddress'),
        clientPreview: document.getElementById('clientPreview'),
        clientNamePreview: document.getElementById('clientNamePreview'),
        clientEmailPreview: document.getElementById('clientEmailPreview'),
        clientPhonePreview: document.getElementById('clientPhonePreview'),
        clientAddressPreview: document.getElementById('clientAddressPreview'),
        removeClientBtn: document.getElementById('removeClientBtn'),
        editClientBtn: document.getElementById('editClientBtn'),
        createClientForm: document.getElementById('createClientForm'),
        editClientForm: document.getElementById('editClientForm'),
    };

    async function fetchClients(query) {
        try {
            console.log(`Fetching clients with query: ${query}`);
            const response = await fetch(`/clients/search?query=${query}`, { cache: 'no-store' });
            console.log(`Response status: ${response.status}`);
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
        } catch (error) {
            console.error('Error fetching clients:', error);
            return [];
        }
    }

    function handleClientSearchInput() {
        elements.clientSearchInput.addEventListener('input', async function() {
            const query = elements.clientSearchInput.value.trim();
            elements.clientResults.innerHTML = '';

            if (query.length <= 2) return;

            const clients = await fetchClients(query);
            if (clients.success && clients.data.length > 0) {
                clients.data.forEach(client => {
                    const clientItem = createClientListItem(client);
                    elements.clientResults.appendChild(clientItem);
                });
            } else {
                displayNoResultsMessage();
            }
        });
    }

    function createClientListItem(client) {
        const clientItem = document.createElement('a');
        clientItem.href = '#';
        clientItem.className = 'list-group-item list-group-item-action';
        clientItem.textContent = client.name;
        clientItem.dataset.client = JSON.stringify(client);
        return clientItem;
    }

    function displayNoResultsMessage() {
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
        elements.clientResults.appendChild(noResults);
    }

    function handleClientResultsClick() {
        elements.clientResults.addEventListener('click', function(event) {
            if (event.target && event.target.matches('a.list-group-item-action')) {
                event.preventDefault();
                const client = JSON.parse(event.target.dataset.client);
                populateClientDetails(client);
            }
        });
    }

    function populateClientDetails(client) {
        elements.clientSearchInput.value = client.name;
        elements.clientIdInput.value = client._id;
        elements.clientNameInput.value = client.name;
        elements.clientEmailInput.value = client.email;
        elements.clientPhoneInput.value = client.phoneNumber;
        elements.clientAddressInput.value = `${client.streetAddress}, ${client.city}, ${client.state}, ${client.zip}`;
        elements.clientNamePreview.textContent = client.name;
        elements.clientEmailPreview.textContent = client.email;
        elements.clientPhonePreview.textContent = client.phoneNumber;
        elements.clientAddressPreview.textContent = `${client.streetAddress}, ${client.city}, ${client.state}, ${client.zip}`;
        elements.clientPreview.classList.remove('d-none');
        elements.clientResults.innerHTML = '';
    }

    function handleClientFormSubmit(form, successCallback) {
        form.addEventListener('submit', async function(event) {
            event.preventDefault();
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            // Format the phone number correctly
            if (data.phoneNumber) {
                data.phoneNumber = data.phoneNumber.replace(/\D/g, '');
            }

            // Remove clientId and _csrf from the data
            delete data.clientId;
            delete data._csrf;

            try {
                const response = await fetch(`/clients/${elements.clientIdInput.value}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'CSRF-Token': formData.get('_csrf')
                    },
                    body: JSON.stringify(data)
                });
                if (!response.ok) throw new Error('Network response was not ok');

                const result = await response.json();
                if (result.success) {
                    successCallback(result.data);
                } else {
                    console.error(`Failed to update client:`, result.error);
                    alert(`Failed to update client. Please try again.`);
                }
            } catch (error) {
                console.error(error);
                alert(`Error updating client. Please try again.`);
            }
        });
    }

    function handleClientCreationSuccess(newClient) {
        populateClientDetails(newClient);
        const createClientModal = bootstrap.Modal.getInstance(document.getElementById('createClientModal'));
        createClientModal.hide();
    }

    function handleClientUpdateSuccess(updatedClient) {
        populateClientDetails(updatedClient);
        const editClientModal = bootstrap.Modal.getInstance(document.getElementById('editClientModal'));
        editClientModal.hide();
    }

    function handleRemoveClientButton() {
        elements.removeClientBtn.addEventListener('click', function(event) {
            event.preventDefault();
            if (confirm('Are you sure you want to remove this client from the quote?')) {
                resetClientDetails();
            }
        });
    }

    function resetClientDetails() {
        const inputs = [elements.clientIdInput, elements.clientNameInput, elements.clientEmailInput, elements.clientPhoneInput, elements.clientAddressInput, elements.clientSearchInput];
        inputs.forEach(input => input.value = '');
        const previews = [elements.clientNamePreview, elements.clientEmailPreview, elements.clientPhonePreview, elements.clientAddressPreview];
        previews.forEach(preview => preview.textContent = '');
        elements.clientPreview.classList.add('d-none');
    }

    function handleEditClientButton() {
        elements.editClientBtn.addEventListener('click', async function(event) {
            event.preventDefault();
            const clientId = elements.clientIdInput.value;
            if (!clientId) return alert('No client selected for editing.');

            try {
                const response = await fetch(`/clients/${clientId}`, { cache: 'no-store' });
                if (!response.ok) throw new Error('Network response was not ok');

                const client = await response.json();
                populateEditClientForm(client.data);
            } catch (error) {
                console.error('Error fetching client for edit:', error);
                alert('Error fetching client data. Please try again.');
            }
        });
    }

    function populateEditClientForm(client) {
        document.getElementById('editClientId').value = client._id;
        document.getElementById('editClientName').value = client.name;
        document.getElementById('editClientEmail').value = client.email;
        document.getElementById('editClientPhoneNumber').value = client.phoneNumber;
        document.getElementById('editClientStreetAddress').value = client.streetAddress;
        document.getElementById('editClientCity').value = client.city;
        document.getElementById('editClientState').value = client.state;
        document.getElementById('editClientZip').value = client.zip;

        const editClientModal = new bootstrap.Modal(document.getElementById('editClientModal'));
        editClientModal.show();
    }

    handleClientSearchInput();
    handleClientResultsClick();
    handleClientFormSubmit(elements.createClientForm, handleClientCreationSuccess);
    handleClientFormSubmit(elements.editClientForm, handleClientUpdateSuccess);
    handleRemoveClientButton();
    handleEditClientButton();
});
