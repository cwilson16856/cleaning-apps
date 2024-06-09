document.addEventListener('DOMContentLoaded', function() {
  const editClientBtn = document.getElementById('editClientBtn');
  const addNoteBtn = document.getElementById('addNoteBtn');
  const newNote = document.getElementById('newNote');
  const notesList = document.getElementById('notesList');
  const clientId = document.getElementById('clientId')?.value ?? '';
  const csrfToken = document.getElementById('csrfToken')?.value ?? '';

  if (editClientBtn) {
    editClientBtn.addEventListener('click', function() {
      window.location.href = `/clients/${clientId}/edit`;
    });
  }

  async function handleFetch(url, options, errorMsg) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text);
      }
      return await response.json();
    } catch (error) {
      console.error(`${errorMsg}:`, error);
      alert(error.message);
      throw error;
    }
  }

  function appendNewNoteElement(note) {
    const li = document.createElement('li');
    li.className = 'list-group-item d-flex justify-content-between align-items-center';
    li.id = `note-item-${note.id}`;
    li.innerHTML = `
      <span id="note-${note.id}" style="white-space: pre-wrap;">${note.text}</span>
      <textarea id="edit-note-${note.id}" class="form-control d-none">${note.text}</textarea>
      <div class="note-actions">
        <button class="btn btn-sm btn-primary edit-note" data-note-id="${note.id}">Edit</button>
        <button class="btn btn-sm btn-success save-note d-none" data-note-id="${note.id}">Save</button>
        <button class="btn btn-sm btn-danger delete-note" data-note-id="${note.id}">Delete</button>
        <button class="btn btn-sm btn-secondary cancel-edit d-none" data-note-id="${note.id}">Cancel</button>
      </div>`;
    notesList.appendChild(li);

    li.querySelector('.edit-note').addEventListener('click', enableEdit);
    li.querySelector('.save-note').addEventListener('click', saveNote);
    li.querySelector('.delete-note').addEventListener('click', deleteNote);
    li.querySelector('.cancel-edit').addEventListener('click', cancelEdit);

    // Auto-expand text area
    autoExpand(li.querySelector('textarea'));
  }

  function autoExpand(textarea) {
    textarea.addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = this.scrollHeight + 'px';
    });
  }

  async function addNote() {
    const noteText = newNote.value.trim();
    if (noteText !== '') {
      const result = await handleFetch(
        `/clients/${clientId}/notes`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'CSRF-Token': csrfToken,
          },
          body: JSON.stringify({ note: noteText }),
        },
        'Error adding note:'
      );
      appendNewNoteElement(result.note);
      newNote.value = '';
    }
  }

  function enableEdit() {
    const noteId = this.dataset.noteId;
    document.getElementById(`note-${noteId}`).classList.add('d-none');
    document.getElementById(`edit-note-${noteId}`).classList.remove('d-none');
    this.classList.add('d-none');
    document.querySelector(`.save-note[data-note-id="${noteId}"]`).classList.remove('d-none');
    document.querySelector(`.cancel-edit[data-note-id="${noteId}"]`).classList.remove('d-none');
  }

  function cancelEdit() {
    const noteId = this.dataset.noteId;
    document.getElementById(`note-${noteId}`).classList.remove('d-none');
    document.getElementById(`edit-note-${noteId}`).classList.add('d-none');
    document.querySelector(`.save-note[data-note-id="${noteId}"]`).classList.add('d-none');
    document.querySelector(`.edit-note[data-note-id="${noteId}"]`).classList.remove('d-none');
    document.querySelector(`.cancel-edit[data-note-id="${noteId}"]`).classList.add('d-none');
  }

  async function saveNote() {
    const noteId = this.dataset.noteId;
    const newNote = document.getElementById(`edit-note-${noteId}`).value.trim();
    if (newNote !== '') {
      const result = await handleFetch(
        `/clients/${clientId}/notes/${noteId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'CSRF-Token': csrfToken,
          },
          body: JSON.stringify({ note: newNote }),
        },
        'Error updating note:'
      );
      document.getElementById(`note-${noteId}`).innerText = newNote;
      document.getElementById(`note-${noteId}`).classList.remove('d-none');
      document.getElementById(`edit-note-${noteId}`).classList.add('d-none');
      this.classList.add('d-none');
      document.querySelector(`.edit-note[data-note-id="${noteId}"]`).classList.remove('d-none');
      document.querySelector(`.cancel-edit[data-note-id="${noteId}"]`).classList.add('d-none');
    }
  }

  async function deleteNote() {
    const noteId = this.dataset.noteId;
    if (confirm('Are you sure you want to delete this note?')) {
      const result = await handleFetch(
        `/clients/${clientId}/notes/${noteId}`,
        {
          method: 'DELETE',
          headers: {
            'CSRF-Token': csrfToken,
          },
        },
        'Error deleting note:'
      );
      const noteElement = document.getElementById(`note-item-${noteId}`);
      noteElement.remove();
    }
  }

  if (addNoteBtn) {
    addNoteBtn.addEventListener('click', addNote);
  }

  document.querySelectorAll('.edit-note').forEach(button => button.addEventListener('click', enableEdit));
  document.querySelectorAll('.save-note').forEach(button => button.addEventListener('click', saveNote));
  document.querySelectorAll('.delete-note').forEach(button => button.addEventListener('click', deleteNote));
  document.querySelectorAll('.cancel-edit').forEach(button => button.addEventListener('click', cancelEdit));

  // Initialize auto-expand for existing textareas
  document.querySelectorAll('textarea').forEach(textarea => autoExpand(textarea));
});
