document.addEventListener('DOMContentLoaded', function() {
    const addServiceItemBtn = document.getElementById('addServiceItemBtn');
    const serviceItemsSection = document.getElementById('serviceItemsSection');
    const validationErrorsElement = document.getElementById('validationErrors');

    // Function to update pricing information dynamically
    function updatePricing() {
        let subtotal = 0;
        document.querySelectorAll('.serviceItemSelect').forEach(select => {
            const selectedOption = select.options[select.selectedIndex];
            if (selectedOption && selectedOption.dataset.price) {
                const quantityInput = select.closest('.service-item-row').querySelector('.itemQuantity');
                const quantity = parseFloat(quantityInput.value) || 0;
                const price = parseFloat(selectedOption.dataset.price);
                subtotal += quantity * price;
            }
        });
        const taxRateInput = document.getElementById('taxRate');
        const taxRate = parseFloat(taxRateInput.value) / 100 || 0;
        const taxAmount = subtotal * taxRate;
        const total = subtotal + taxAmount;
        document.getElementById('subtotal').textContent = `Subtotal: $${subtotal.toFixed(2)}`;
        document.getElementById('total').textContent = `Total: $${total.toFixed(2)}`;
    }

    // Fetch and populate service items
    function fetchServiceItems() {
        axios.get('/items')
            .then(function(response) {
                const serviceItems = response.data;
                serviceItems.forEach(item => {
                    const option = document.createElement('option');
                    option.value = item._id;
                    option.textContent = `${item.name} - $${item.price}`;
                    option.dataset.price = item.price; // Store price in data attribute for easy access
                    // Append option to all service item selects if not already present
                    document.querySelectorAll('.serviceItemSelect').forEach(select => {
                        const exists = Array.from(select.options).some(option => option.value === item._id);
                        if (!exists) {
                            select.appendChild(option.cloneNode(true));
                        }
                    });
                });
                updatePricing(); // Update pricing after populating service items
            })
            .catch(function(error) {
                console.error("Error fetching service items:", error.message, error.stack);
                validationErrorsElement.innerHTML = 'Failed to fetch service items. Please refresh the page and try again.';
                validationErrorsElement.classList.remove('d-none');
            });
    }

    // Add new service item row
    addServiceItemBtn.addEventListener('click', function() {
        const serviceItemTemplate = document.getElementById('serviceItemTemplate').content.cloneNode(true);
        const newServiceItemRow = document.importNode(serviceItemTemplate, true);
        serviceItemsSection.appendChild(newServiceItemRow);

        // Attach event listeners to newly added row for dynamic pricing update
        const newItemSelect = serviceItemsSection.lastElementChild.querySelector('.serviceItemSelect');
        const newItemQuantity = serviceItemsSection.lastElementChild.querySelector('.itemQuantity');
        newItemSelect.addEventListener('change', updatePricing);
        newItemQuantity.addEventListener('input', updatePricing);

        serviceItemsSection.lastElementChild.querySelector('.removeServiceItemBtn').addEventListener('click', function() {
            this.closest('.service-item-row').remove();
            updatePricing(); // Update pricing when an item is removed
        });

        // Populate the newly added service item select
        fetchServiceItems();
    });

    // Initial fetch and populate service items
    fetchServiceItems();
});