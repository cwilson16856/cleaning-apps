document.addEventListener('DOMContentLoaded', function() {
    function addRemoveButtonEventListeners(selector, containerSelector) {
        document.querySelectorAll(selector).forEach(btn => {
            btn.addEventListener('click', (event) => {
                event.target.closest(containerSelector).remove();
            });
        });
    }

    // Add attachment
    document.getElementById('addAttachmentBtn').addEventListener('click', () => {
        const attachmentsContainer = document.getElementById('attachmentsContainer');
        const uniqueId = `attachments-${Date.now()}`;
        const attachmentGroup = document.createElement('div');
        attachmentGroup.className = 'form-group attachment-group';
        attachmentGroup.innerHTML = `
            <label for="${uniqueId}">Upload Attachments</label>
            <input type="file" id="${uniqueId}" name="attachments" class="form-control" multiple>
            <button type="button" class="btn btn-danger mt-2 remove-attachment-btn">Remove</button>
        `;
        attachmentsContainer.appendChild(attachmentGroup);
        addRemoveButtonEventListeners('.remove-attachment-btn', '.attachment-group');
    });

    // Add contract
    document.getElementById('addContractBtn').addEventListener('click', () => {
        const contractsContainer = document.getElementById('contractsContainer');
        const uniqueId = `contracts-${Date.now()}`;
        const contractGroup = document.createElement('div');
        contractGroup.className = 'form-group contract-group';
        contractGroup.innerHTML = `
            <label for="${uniqueId}">Upload Contracts</label>
            <input type="file" id="${uniqueId}" name="contracts" class="form-control" multiple>
            <button type="button" class="btn btn-danger mt-2 remove-contract-btn">Remove</button>
        `;
        contractsContainer.appendChild(contractGroup);
        addRemoveButtonEventListeners('.remove-contract-btn', '.contract-group');
    });

    // Initial event listeners for existing remove buttons
    addRemoveButtonEventListeners('.remove-attachment-btn', '.attachment-group');
    addRemoveButtonEventListeners('.remove-contract-btn', '.contract-group');

    document.getElementById('calculateDistanceBtn').addEventListener('click', async () => {
        const clientId = document.getElementById('clientId').value;
        const userAddress = document.getElementById('userAddress').value;
        const csrfToken = document.querySelector('input[name="_csrf"]').value;

        try {
            const response = await axios.post('/quotes/calculate-distance', { clientId, userAddress }, {
                headers: {
                    'CSRF-Token': csrfToken
                }
            });
            document.getElementById('distance').value = response.data.distance;
        } catch (error) {
            console.error('Error calculating distance:', error);
            alert('Failed to calculate distance. Please try again.');
        }
    });

    const scopeOfWorkTextarea = document.getElementById('scopeOfWork');

    scopeOfWorkTextarea.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });

    // Trigger input event to adjust height on page load if there's pre-filled content
    scopeOfWorkTextarea.dispatchEvent(new Event('input'));

    document.getElementById('quoteForm').addEventListener('submit', (event) => {
        const fields = ['clientId', 'quoteTitle', 'scopeOfWork'];
        let isValid = true;

        fields.forEach((field) => {
            const input = document.getElementById(field);
            if (!input.value.trim()) {
                isValid = false;
                input.classList.add('is-invalid');
            } else {
                input.classList.remove('is-invalid');
                input.classList.add('is-valid');
            }
        });

        if (!isValid) {
            event.preventDefault();
            alert('Please fill in all required fields.');
        }
    });
});
