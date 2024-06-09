document.addEventListener('DOMContentLoaded', function() {
    // Check for the 'updated' query parameter and show a modal if it exists
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('updated')) {
        const myModal = new bootstrap.Modal(document.getElementById('updateModal'));
        myModal.show();
    }
});
