document.addEventListener('DOMContentLoaded', function() {
    const serviceItemsList = document.getElementById('serviceItemsList');
    const addServiceItemBtn = document.getElementById('addServiceItemBtn');

    // Function to add a new item to the list
    function addServiceItem(itemId, name, category, price, description) {
        const serviceItemElement = document.createElement('tr');
        serviceItemElement.classList.add('item');
        serviceItemElement.dataset.itemId = itemId; // Assign itemId to the dataset for edit and delete operations
        serviceItemElement.innerHTML = `
            <td>${name}</td>
            <td>${category}</td>
            <td>${description}</td>
            <td>$${price}</td>
            <td>
                <a href="/items/${itemId}/edit" class="btn btn-warning btn-sm">Edit</a>
                <button class="btn btn-danger btn-sm deleteServiceItemBtn">Delete</button>
            </td>
        `;
        serviceItemsList.appendChild(serviceItemElement);

        // Event listener for delete button
        serviceItemElement.querySelector('.deleteServiceItemBtn').addEventListener('click', async function() {
            try {
                const response = await fetch(`/items/${itemId}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': document.querySelector('input[name="_csrf"]').value // Ensure CSRF token is included
                    }
                });
                if (response.ok) {
                    serviceItemElement.remove();
                    console.log(`Service item ${itemId} deleted.`);
                } else {
                    console.error('Failed to delete service item:', response.statusText);
                }
            } catch (error) {
                console.error('Failed to delete service item:', error);
            }
        });
    }

    // Fetch and populate service items from the server
    async function fetchAndPopulateServiceItems() {
        try {
            const response = await fetch('/items'); // Correct endpoint
            const serviceItems = await response.json();
            serviceItems.forEach(item => {
                addServiceItem(item._id, item.name, item.category, item.price, item.description);
            });
            console.log('Service items fetched and populated successfully.');
            logToServer('error', `Error fetching service items: ${error.message}`);
        } catch (error) {
            console.error('Failed to fetch service items:', error);
        }
    }

    // Initial fetch and populate service items
    fetchAndPopulateServiceItems();

    // Additional logic for handling dynamic updates, form submissions, etc., can be added here
});
