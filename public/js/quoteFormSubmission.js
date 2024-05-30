document.addEventListener('DOMContentLoaded', function() {
    const addServiceItemBtn = document.getElementById('addServiceItemBtn');
    const serviceItemsSection = document.getElementById('serviceItemsSection');
    const validationErrorsElement = document.getElementById('validationErrors');
    const subtotalElement = document.getElementById('subtotal');
    const taxRateElement = document.getElementById('taxRate');
    const totalElement = document.getElementById('total');
    let serviceItemCounter = 0; // Counter to ensure unique IDs for dynamically added service items
    const serviceTypeSelect = document.getElementById('serviceType');
    const frequencyDiv = document.getElementById('frequencyDiv');
    const initialCleaningDiv = document.getElementById('initialCleaningDiv');

    // Function to add new service item row
    function addServiceItemRow() {
        serviceItemCounter++; // Increment counter for each new service item
        const serviceItemTemplate = document.getElementById('serviceItemTemplate').cloneNode(true);
        serviceItemTemplate.style.display = 'block';
        serviceItemTemplate.id = `serviceItem${serviceItemCounter}`;
        serviceItemTemplate.querySelector('.serviceItemSelect').required = true; // Ensure required attribute is set
        const quantityInput = serviceItemTemplate.querySelector('input[type="number"]');
        quantityInput.required = true; // Ensure required attribute is set
        quantityInput.id = `quantity${serviceItemCounter}`; // Set unique ID for quantity input
        const quantityLabel = serviceItemTemplate.querySelector('label[for="quantity"]');
        if (quantityLabel) quantityLabel.setAttribute('for', `quantity${serviceItemCounter}`); // Update label's for attribute to match input's id
        serviceItemsSection.appendChild(serviceItemTemplate);

        // Remove service item row on button click
        const removeBtn = serviceItemTemplate.querySelector('.removeServiceItemBtn');
        removeBtn.addEventListener('click', function() {
            serviceItemTemplate.remove();
            updatePricing();
        });

        // Update pricing when quantity changes
        quantityInput.addEventListener('change', updatePricing);

        // Populate the newly added service item select
        fetchServiceItems();
    }

    // Fetch and populate service items
    async function fetchServiceItems() {
        try {
            const response = await axios.get('/api/service-items');
            if (!response.data.success) {
                throw new Error("Failed to fetch service items: Success flag not true");
            }
            const serviceItems = response.data.data;
            if (!Array.isArray(serviceItems)) {
                console.error("Service items data is not an array:", serviceItems);
                throw new Error("Service items data is not an array");
            }
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
            console.error("Failed to fetch service items:", error.message, error.stack);
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
        subtotalElement.textContent = `$${subtotal.toFixed(2)}`; // Update the text content with currency symbol
        const taxRate = parseFloat(taxRateElement.value) || 0;
        const taxAmount = subtotal * (taxRate / 100);
        const total = subtotal + taxAmount;
        totalElement.textContent = `$${total.toFixed(2)}`; // Update the text content with currency symbol
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
        let formValid = true;

        document.querySelectorAll('.serviceItemSelect').forEach((select, index) => {
            const quantityInput = document.querySelectorAll('input[name="quantities[]"]')[index];
            if (quantityInput && select.value && quantityInput.value) {
                const quantity = parseFloat(quantityInput.value) || 0;
                data.serviceItems.push({
                    serviceItemId: select.value,
                    quantity: quantity
                });
            } else {
                formValid = false;
            }
        });

        if (!formValid) {
            validationErrorsElement.innerHTML = 'Please fill out all required fields for service items.';
            validationErrorsElement.classList.remove('d-none');
            return;
        }

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
            console.error('Error creating quote', error.response.data, error.message, error.stack);
            validationErrorsElement.innerHTML = 'Failed to create quote. Please try again.';
            validationErrorsElement.classList.remove('d-none');
        });
    });

    // Function to toggle visibility of elements based on service type
    function toggleServiceOptions() {
        const selectedServiceType = serviceTypeSelect.value;
        // Hide all options initially
        frequencyDiv.style.display = 'none';
        initialCleaningDiv.style.display = 'none';

        // Show options based on selected service type
        if (selectedServiceType === 'Recurring') {
            frequencyDiv.style.display = 'block';
        } else if (selectedServiceType === 'One-Time Deep Clean' || selectedServiceType === 'Move In/Move Out') {
            initialCleaningDiv.style.display = 'block';
        }
    }

    // Initial toggle on page load in case the select has a default value
    toggleServiceOptions();

    // Event listener for service type change
    serviceTypeSelect.addEventListener('change', toggleServiceOptions);
});