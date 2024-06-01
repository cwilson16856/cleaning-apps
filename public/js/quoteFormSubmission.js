document.addEventListener('DOMContentLoaded', function() {
    const addLineItemBtn = document.getElementById('addLineItemBtn');
    const lineItemsContainer = document.getElementById('lineItemsContainer');
    const validationErrorsElement = document.getElementById('validationErrors');
    const subtotalElement = document.getElementById('subtotal');
    const taxRateElement = document.getElementById('taxRate');
    const totalElement = document.getElementById('total');
    let lineItemCounter = 0;

    // Function to add a new line item row
    function addLineItemRow() {
        lineItemCounter++;
        const lineItem = document.createElement('div');
        lineItem.className = 'line-item';
        lineItem.innerHTML = `
            <div class="form-group">
                <label for="itemSearch${lineItemCounter}">Item</label>
                <input type="text" id="itemSearch${lineItemCounter}" class="form-control itemSearch" placeholder="Search for item...">
                <div class="itemDropdown d-none"></div>
            </div>
            <div class="form-group">
                <label for="description${lineItemCounter}">Description</label>
                <input type="text" id="description${lineItemCounter}" class="form-control description" placeholder="Description">
            </div>
            <div class="form-group">
                <label for="quantity${lineItemCounter}">Quantity</label>
                <input type="number" id="quantity${lineItemCounter}" class="form-control quantity" value="1" min="1">
            </div>
            <div class="form-group">
                <label for="rate${lineItemCounter}">Rate</label>
                <input type="number" id="rate${lineItemCounter}" class="form-control rate" value="0" step="0.01">
            </div>
            <div class="form-group">
                <label for="total${lineItemCounter}">Total</label>
                <input type="number" id="total${lineItemCounter}" class="form-control total" value="0" readonly>
            </div>
            <button type="button" class="btn btn-danger removeLineItemBtn">Remove</button>
        `;
        lineItemsContainer.appendChild(lineItem);

        // Event listener for removing the line item
        lineItem.querySelector('.removeLineItemBtn').addEventListener('click', function() {
            lineItem.remove();
            updatePricing();
        });

        // Event listeners for quantity and rate changes
        lineItem.querySelector('.quantity').addEventListener('input', updatePricing);
        lineItem.querySelector('.rate').addEventListener('input', updatePricing);
        lineItem.querySelector('.itemSearch').addEventListener('input', fetchServiceItems);
        lineItem.querySelector('.itemSearch').addEventListener('blur', () => setTimeout(() => hideDropdown(lineItem.querySelector('.itemDropdown')), 200));

        updatePricing();
    }

    // Fetch and populate service items
    async function fetchServiceItems(event) {
        try {
            const query = event.target.value.trim();
            const dropdown = event.target.nextElementSibling; // Get the dropdown element
            if (query.length > 2) {
                const response = await axios.get(`/api/service-items?query=${query}`);
                const serviceItems = response.data.data;
                showDropdown(dropdown, event.target, serviceItems);
            } else {
                hideDropdown(dropdown);
            }
        } catch (error) {
            console.error('Failed to fetch service items:', error);
        }
    }

    // Show dropdown for service items
    function showDropdown(dropdown, inputElement, items) {
        dropdown.classList.remove('d-none'); // Show the dropdown
        dropdown.innerHTML = '';
        items.forEach(item => {
            const option = document.createElement('div');
            option.className = 'dropdown-item';
            option.textContent = item.name;
            option.dataset.id = item._id; // Store the ObjectId in data attribute
            option.dataset.price = item.price;
            option.addEventListener('click', () => {
                inputElement.value = item.name;
                const rateInput = inputElement.closest('.line-item').querySelector('.rate');
                rateInput.value = item.price;
                const descriptionInput = inputElement.closest('.line-item').querySelector('.description');
                descriptionInput.value = item.description || ''; // Set description if available
                const itemIdInput = document.createElement('input'); // Create hidden input for serviceItemId
                itemIdInput.type = 'hidden';
                itemIdInput.name = 'serviceItemIds[]';
                itemIdInput.value = item._id;
                inputElement.closest('.line-item').appendChild(itemIdInput);
                updatePricing();
                hideDropdown(dropdown); // Hide the dropdown after selection
            });
            dropdown.appendChild(option);
        });
    }

    // Hide dropdown
    function hideDropdown(dropdown) {
        dropdown.classList.add('d-none'); // Hide the dropdown
        dropdown.innerHTML = '';
    }

    // Calculate and update pricing
    function updatePricing() {
        let subtotal = 0;
        document.querySelectorAll('.line-item').forEach(lineItem => {
            const quantity = parseFloat(lineItem.querySelector('.quantity').value) || 0;
            const rate = parseFloat(lineItem.querySelector('.rate').value) || 0;
            const total = quantity * rate;
            lineItem.querySelector('.total').value = total.toFixed(2);
            subtotal += total;
        });
        subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
        const taxRate = parseFloat(taxRateElement.value) || 0;
        const taxAmount = subtotal * (taxRate / 100);
        const total = subtotal + taxAmount;
        totalElement.textContent = `$${total.toFixed(2)}`;
    }

    // Add new line item row on button click
    addLineItemBtn.addEventListener('click', addLineItemRow);

    // Update pricing when tax rate changes
    taxRateElement.addEventListener('input', updatePricing);

    // Handle form submission
    document.getElementById('quoteForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        const data = Object.fromEntries(formData.entries());
        data.serviceItems = [];
        let formValid = true;

        document.querySelectorAll('.line-item').forEach(lineItem => {
            const itemSearch = lineItem.querySelector('.itemSearch').value.trim();
            const description = lineItem.querySelector('.description').value.trim();
            const quantity = parseFloat(lineItem.querySelector('.quantity').value) || 0;
            const rate = parseFloat(lineItem.querySelector('.rate').value) || 0;
            const serviceItemId = lineItem.querySelector('input[name="serviceItemIds[]"]')?.value;
            if (itemSearch && quantity && rate && serviceItemId) {
                data.serviceItems.push({
                    serviceItemId: serviceItemId,
                    description: description,
                    quantity: quantity,
                    rate: rate
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

        // Ensure clientName is set
        const clientName = document.getElementById('clientSearch').value;
        if (!clientName) {
            validationErrorsElement.innerHTML = 'Please select a client.';
            validationErrorsElement.classList.remove('d-none');
            return;
        }
        data.clientName = clientName;

        // Validate and set frequency field
        const serviceType = document.getElementById('serviceType').value;
        if (serviceType === 'Recurring') {
            const frequency = document.getElementById('frequency').value;
            if (frequency === 'Choose...') {
                validationErrorsElement.innerHTML = 'Please select a valid frequency.';
                validationErrorsElement.classList.remove('d-none');
                return;
            }
            data.frequency = frequency;
        } else {
            data.frequency = null; // Set frequency to null for non-recurring services
        }

        console.log('Form data being sent:', data); // Log the data object

        axios.post('/quotes', data, {
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': formData.get('_csrf')
            }
        })
        .then(function(response) {
            console.log('Quote created successfully', response.data);
            window.location.href = '/quotes'; // Redirect to dashboard after successful creation
        })
        .catch(function(error) {
            console.error('Error creating quote', error.response.data, error.message, error.stack);
            validationErrorsElement.innerHTML = 'Failed to create quote. Please try again.';
            validationErrorsElement.classList.remove('d-none');
        });
    });

    // Initial line item row
    addLineItemRow();
});
