document.addEventListener('DOMContentLoaded', function() {
    const addServiceItemBtn = document.getElementById('addServiceItemBtn');
    const serviceItemsSection = document.getElementById('serviceItemsSection');
    const validationErrorsElement = document.getElementById('validationErrors');
    const subtotalElement = document.getElementById('subtotal');
    const taxRateElement = document.getElementById('taxRate');
    const totalElement = document.getElementById('total');

    // Function to add new service item row
    function addServiceItemRow() {
        const serviceItemTemplate = document.getElementById('serviceItemTemplate').cloneNode(true);
        serviceItemTemplate.style.display = 'block';
        serviceItemTemplate.id = '';
        serviceItemsSection.appendChild(serviceItemTemplate);

        // Remove service item row on button click
        const removeBtn = serviceItemTemplate.querySelector('.removeServiceItemBtn');
        removeBtn.addEventListener('click', function() {
            this.parentNode.remove();
            updatePricing();
        });

        // Update pricing when quantity changes
        const quantityInput = serviceItemTemplate.querySelector('input[type="number"]');
        quantityInput.addEventListener('change', updatePricing);

        // Populate the newly added service item select
        fetchServiceItems();
    }

    // Fetch and populate service items
    async function fetchServiceItems() {
        try {
            const response = await axios.get('/items');
            const serviceItems = response.data;
            document.querySelectorAll('.serviceItemSelect').forEach(select => {
                if (select.options.length === 1) { // Only add options if they are not already present
                    serviceItems.forEach(item => {
                        const option = document.createElement('option');
                        option.value = item._id;
                        option.textContent = item.name;
                        option.dataset.price = item.price; // Store price in data attribute
                        select.appendChild(option);
                    });
                }
            });
        } catch (error) {
            console.error("Error fetching service items:", error.message, error.stack);
            validationErrorsElement.innerHTML = 'Failed to fetch service items. Please refresh the page and try again.';
            validationErrorsElement.classList.remove('d-none');
        }
    }

    // Calculate and update pricing
    function updatePricing() {
        let subtotal = 0;
        document.querySelectorAll('.serviceItemSelect').forEach((select, index) => {
            const quantityInput = document.querySelectorAll('input[name="quantities[]"]')[index];
            if (quantityInput) {
                const quantity = parseFloat(quantityInput.value) || 0;
                const price = parseFloat(select.selectedOptions[0].dataset.price) || 0; // Access price from data attribute
                subtotal += quantity * price;
            } else {
                console.error("Error updating pricing: Quantity Input for index " + index + " is missing in the DOM.");
            }
        });
        subtotalElement.textContent = `Subtotal: $${subtotal.toFixed(2)}`;
        const taxRate = parseFloat(taxRateElement.value) || 0;
        const taxAmount = subtotal * (taxRate / 100);
        const total = subtotal + taxAmount;
        totalElement.textContent = `Total: $${total.toFixed(2)}`;
    }

    // Add new service item row on button click
    addServiceItemBtn.addEventListener('click', addServiceItemRow);

    // Initial fetch and populate service items
    fetchServiceItems();

    // Update pricing when tax rate changes
    taxRateElement.addEventListener('change', updatePricing);

    // Handle form submission
    document.getElementById('quoteForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        const data = Object.fromEntries(formData.entries());
        data.serviceItems = [];
        document.querySelectorAll('.serviceItemSelect').forEach((select, index) => {
            const quantityInput = document.querySelectorAll('input[name="quantities[]"]')[index];
            if (quantityInput) {
                const quantity = parseFloat(quantityInput.value) || 0;
                data.serviceItems.push({
                    serviceItemId: select.value,
                    quantity: quantity
                });
            } else {
                console.error("Error preparing form data for submission: Quantity Input for index " + index + " is missing in the DOM.");
            }
        });

        axios.post('/quotes', data, {
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': formData.get('_csrf')
            }
        })
        .then(function(response) {
            console.log('Quote created successfully', response.data);
            window.location.href = '/dashboard'; // Redirect to dashboard after successful creation
        })
        .catch(function(error) {
            console.error('Error creating quote', error.response.data, error.stack);
            validationErrorsElement.innerHTML = 'Failed to create quote. Please try again.';
            validationErrorsElement.classList.remove('d-none');
        });
    });
});