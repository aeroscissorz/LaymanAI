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

  // Clean the content
  content = content.replace(/\[[^\]]*\]/g, ''); // Remove [brackets]
  content = content.replace(/\s+/g, ' ').trim(); // Collapse whitespace

  // Truncate to 300 characters
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
        prompt: `Explain this content (add relevant emojis too) in a fun way (as if i am a noob) using the theme: ${theme}\n\n${truncatedContent}`
      })
    });

    const contentType = response.headers.get('Content-Type');
    let resultText = "";

    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      resultText = data.result || "⚠️ No result received.";
    } else {
      resultText = await response.text();
    }

    // Format result: escape HTML, allow emojis & line breaks
    const formatted = resultText
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n/g, "<br>");

    document.getElementById('result').innerHTML = formatted;

  } catch (err) {
    console.error("❌ Fetch error:", err);
    document.getElementById('result').textContent = "❌ Server error. Please try again later.";
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
