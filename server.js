<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Chris Website</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>

  <!-- Floating Particle Canvas --><!-- Animated Sky with Clouds -->
<div class="sky">
  <div class="cloud"></div>
  <div class="cloud"></div>
  <div class="cloud"></div>
</div>
  <canvas id="particle-canvas"></canvas>

  <!-- Liquid Background Effect -->
  <div class="liquid-background"></div>

  <!-- Welcome Banner -->
  <div class="welcome-banner">
    <h1 id="snake-text">Welcome to Chris Website</h1>
  </div>

  <!-- Forms -->
  <h2>Submit Text Message</h2>
  <form id="textForm">
    <input type="text" name="content" placeholder="Enter message" required>
    <button type="submit">Send Text</button>
  </form>

  <h2>Upload Video</h2>
  <form id="videoForm" enctype="multipart/form-data">
    <input type="file" name="video" accept="video/*" required>
    <button type="submit">Upload Video</button>
  </form>

  <h2>Upload Voice Message</h2>
  <form id="voiceForm" enctype="multipart/form-data">
    <input type="file" name="voice" accept="audio/*" required>
    <button type="submit">Upload Voice</button>
  </form>

  <hr>

  <h2>📂 Uploaded Content</h2>
  <div id="contentDisplay">
    <p>Loading content...</p>
  </div>

  <!-- Particle Script -->
  <script>
    const canvas = document.getElementById("particle-canvas");
    const ctx = canvas.getContext("2d");

    let particles = [];

    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    function createParticles(num) {
      particles = [];
      for (let i = 0; i < num; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 2 + 1,
          speedX: (Math.random() - 0.5) * 0.3,
          speedY: (Math.random() - 0.5) * 0.3,
          alpha: Math.random()
        });
      }
    }

    function drawParticles() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
        ctx.fill();
        p.x += p.speedX;
        p.y += p.speedY;

        // Wrap around
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
      });
    }

    function animate() {
      drawParticles();
      requestAnimationFrame(animate);
    }

    createParticles(100);
    animate();
  </script>

  <!-- Your backend-related script remains unchanged -->
  <script>
    const apiUrl = 'http://localhost:3000/api';

    document.getElementById('textForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const content = formData.get('content');

      const res = await fetch(`${apiUrl}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });

      const result = await res.json();
      alert(result.message);
      e.target.reset();
      loadMessages();
    });

    document.getElementById('videoForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);

      const res = await fetch(`${apiUrl}/upload/video`, {
        method: 'POST',
        body: formData
      });

      const result = await res.json();
      alert(result.message);
      e.target.reset();
      loadMessages();
    });

    document.getElementById('voiceForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);

      const res = await fetch(`${apiUrl}/upload/voice`, {
        method: 'POST',
        body: formData
      });

      const result = await res.json();
      alert(result.message);
      e.target.reset();
      loadMessages();
    });

    async function loadMessages() {
      const container = document.getElementById('contentDisplay');
      container.innerHTML = 'Loading...';

      const res = await fetch(`${apiUrl}/messages`);
      const messages = await res.json();

      if (messages.length === 0) {
        container.innerHTML = '<p>No content uploaded yet.</p>';
        return;
      }

      container.innerHTML = '';
      messages.forEach(msg => {
        const item = document.createElement('div');
        item.style.marginBottom = '20px';

        if (msg.type === 'text') {
          item.innerHTML = `<p><strong>Text:</strong> ${msg.content}</p>`;
        } else if (msg.type === 'video') {
          item.innerHTML = `
            <p><strong>Video:</strong></p>
            <video width="320" controls>
              <source src="http://localhost:3000/${msg.content}" type="video/mp4">
            </video>
          `;
        } else if (msg.type === 'voice') {
          item.innerHTML = `
            <p><strong>Voice:</strong></p>
            <audio controls>
              <source src="http://localhost:3000/${msg.content}" type="audio/mpeg">
            </audio>
          `;
        }

        container.appendChild(item);
      });
    }

    window.onload = loadMessages;
  </script>
</body>
</html>