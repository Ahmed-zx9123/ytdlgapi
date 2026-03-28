const express = require('express');
const downloader = require('primesave-dl');

const app = express();
const PORT = process.env.PORT || 3000;

function cleanYouTubeUrl(url) {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  return match ? `https://youtu.be/${match[1]}` : null;
}

app.get('/download', async (req, res) => {
  const { url, type = 'mp3', raw = 'false' } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing "url" parameter' });

  const cleanUrl = cleanYouTubeUrl(url);
  if (!cleanUrl) return res.status(400).json({ error: 'Invalid YouTube URL' });

  try {
    const result = await downloader(cleanUrl);
    if (!result.success) throw new Error(result.error || 'Download failed');

    const audioOption = result.options?.find(opt => opt.type === 'Audio');
    if (!audioOption?.url) throw new Error('No audio download link found');

    if (raw === 'true') return res.type('text/plain').send(audioOption.url);
    res.json({ download: audioOption.url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/docs', (req, res) => {
  res.type('text/plain');
  res.send(`
YouTube Direct Download API

Endpoint: GET /download?url=YOUTUBE_URL&type=mp3&raw=true

Example:
  /download?url=https://youtu.be/rFAVe1fUppc&type=mp3&raw=true

Response (raw=true):
  https://direct-audio-link.mp3

Response (raw=false):
  { "download": "https://direct-audio-link.mp3" }

Supported: YouTube, TikTok, Instagram, Facebook, Pinterest
Audio quality: up to 320kbps MP3
  `);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
