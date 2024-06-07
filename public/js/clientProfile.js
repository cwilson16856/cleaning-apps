document.addEventListener('DOMContentLoaded', function() {
    const editClientBtn = document.getElementById('editClientBtn');
    const addNoteBtn = document.getElementById('addNoteBtn');
    const newNote = document.getElementById('newNote');
    const notesList = document.getElementById('notesList');
    const clientId = document.getElementById('clientId').value;
    const csrfToken = document.getElementById('csrfToken').value;
  
    if (editClientBtn) {
      editClientBtn.addEventListener('click', function() {
        window.location.href = `/clients/${clientId}/edit`;
      });
    }
  
    if (addNoteBtn) {
      addNoteBtn.addEventListener('click', async function() {
        const noteText = newNote.value.trim();
        if (noteText !== "") {
          try {
            const response = await fetch(`/clients/${clientId}/notes`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'CSRF-Token': csrfToken,
              },
              body: JSON.stringify({ note: noteText })
            });
            if (response.ok) {
              const result = await response.json();
              if (result.success) {
                const li = document.createElement('li');
                li.className = 'list-group-item';
                li.textContent = noteText;
                notesList.appendChild(li);
                newNote.value = '';
              } else {
                alert('Failed to add note. Please try again.');
              }
            } else {
              alert('Failed to add note. Please try again.');
            }
          } catch (error) {
            console.error('Error adding note:', error);
            alert('An error occurred. Please try again.');
          }
        }
      });
    }
  });
  