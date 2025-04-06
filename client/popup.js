const API_URL = "http://localhost:5000/explain"; // Replace with hosted URL when deployed

// Preset theme buttons
document.querySelectorAll('.preset').forEach(btn => {
  btn.addEventListener('click', () => {
    document.getElementById('customTheme').value = btn.dataset.theme;
  });
});

// Handle explain button click
document.getElementById('explainBtn').addEventListener('click', async () => {
  const theme = document.getElementById('customTheme').value.trim() || "layman's terms";
  let content = document.getElementById('userText').value.trim();

  if (!content) {
    document.getElementById('result').textContent = "⚠️ Please paste some text to explain.";
    return;
  }

  // Remove references like "[a]" and excessive formatting
  content = content.replace(/\[[^\]]*\]/g, ''); // Remove bracketed references
  content = content.replace(/\s+/g, ' ').trim(); // Sanitize whitespace

  // Truncate the cleaned content to 300 characters
  const truncatedContent = content.slice(0, 300);

  const clientId = getClientId();

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': clientId
      },
      body: JSON.stringify({
        prompt: Explain this content in a fun way using the theme: ${theme}\n\n${truncatedContent}
      })
    });

    const data = await response.json();
    const resultText = typeof data.result === 'string' 
      ? data.result 
      : JSON.stringify(data.result || data.error || "⚠️ No response.");
    document.getElementById('result').textContent = resultText;
  } catch (err) {
    document.getElementById('result').textContent = "❌ Server error. Please try again later.";
    console.error(err);
  }
});

function getClientId() {
  let id = localStorage.getItem('laymanai_client_id');
  if (!id) {
    id = 'client-' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('laymanai_client_id', id);
  }
  return id;
}