// public/js/clientLogger.js
function logToServer(level, message) {
    fetch('/logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ level, message })
    }).catch(error => console.error('Error logging to server:', error));
  }
  