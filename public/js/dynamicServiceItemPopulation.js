document.addEventListener('DOMContentLoaded', function() {
    const itemTemplate = document.querySelector('#itemTemplate').content;
    const lineItemsContainer = document.getElementById('lineItemsContainer');
    const addLineItemBtn = document.getElementById('addLineItemBtn');
    const serviceTypeElement = document.getElementById('serviceType');
    const frequencyDiv = document.getElementById('frequencyDiv');
    const initialCleaningDiv = document.getElementById('initialCleaningDiv');

    if (!itemTemplate) {
        console.error('Template element with id "itemTemplate" not found.');
        return;
    }

    function addLineItem() {
        const clone = document.importNode(itemTemplate, true);
        lineItemsContainer.appendChild(clone);
    }

    if (addLineItemBtn) {
        addLineItemBtn.addEventListener('click', addLineItem);
    }

    lineItemsContainer.addEventListener('click', function(event) {
        if (event.target.classList.contains('removeLineItemBtn')) {
            event.target.closest('.line-item').remove();
        }
    });

    lineItemsContainer.addEventListener('input', function(event) {
        const lineItem = event.target.closest('.line-item');
        if (lineItem) {
            const quantity = parseFloat(lineItem.querySelector('.quantity').value) || 0;
            const rate = parseFloat(lineItem.querySelector('.rate').value) || 0;
            const total = quantity * rate;
            lineItem.querySelector('.total').value = total.toFixed(2);
            updateSubtotal();
        }
    });

    function updateSubtotal() {
        const totals = lineItemsContainer.querySelectorAll('.total');
        let subtotal = 0;
        totals.forEach(total => {
            subtotal += parseFloat(total.value) || 0;
        });
        document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
        updateTotal();
    }

    function updateTotal() {
        const subtotal = parseFloat(document.getElementById('subtotal').textContent.slice(1)) || 0;
        const taxRate = parseFloat(document.getElementById('taxRate').value) || 0;
        const total = subtotal + (subtotal * taxRate / 100);
        document.getElementById('total').textContent = `$${total.toFixed(2)}`;
    }

    document.getElementById('taxRate').addEventListener('input', updateTotal);

    // Show/hide frequency and initial cleaning options based on service type
    serviceTypeElement.addEventListener('change', function() {
        const selectedServiceType = serviceTypeElement.value;
        if (selectedServiceType === 'Recurring') {
            frequencyDiv.classList.remove('d-none');
            initialCleaningDiv.classList.add('d-none');
        } else if (selectedServiceType === 'One-Time Deep Clean') {
            frequencyDiv.classList.add('d-none');
            initialCleaningDiv.classList.remove('d-none');
        } else if (selectedServiceType === 'Move In/Move Out') {
            frequencyDiv.classList.add('d-none');
            initialCleaningDiv.classList.add('d-none');
        } else {
            frequencyDiv.classList.add('d-none');
            initialCleaningDiv.classList.add('d-none');
        }
    });
});

