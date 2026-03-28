const express = require('express');
const { getDownloadDetails } = require('youtube-downloader-cc-api');

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
    const response = await getDownloadDetails(cleanUrl, type, 'stream');
    if (!response || !response.download) throw new Error('No download link');
    if (raw === 'true') return res.type('text/plain').send(response.download);
    res.json({ download: response.download });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/docs', (req, res) => {
  res.type('text/plain');
  res.send(`
YouTube Direct Download API

This API converts any YouTube video to a direct download link (MP3/MP4/etc.).
The generated link expires after about 6 hours.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ENDPOINTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. GET /download

   Parameters:
     - url (required) : the YouTube video URL
     - type (optional) : output format (mp3, mp4, webm, m4a). Default is mp3.
     - raw (optional) : if "true", returns only the download URL as plain text. Default is "false".

   Response (raw=false):
     { "download": "https://.../file.mp3" }

   Response (raw=true):
     https://.../file.mp3

   Error response:
     { "error": "description of error" }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EXAMPLES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Example 1: Get MP3 download link (JSON)

Request:
  GET /download?url=https://youtu.be/dQw4w9WgXcQ&type=mp3

Response:
  { "download": "https://yt-downloader-ccprojects-production.up.railway.app/download/1743173841.mp3" }


Example 2: Get MP4 download link as plain text

Request:
  GET /download?url=https://youtu.be/dQw4w9WgXcQ&type=mp4&raw=true

Response:
  https://yt-downloader-ccprojects-production.up.railway.app/download/1743173841.mp4


Example 3: Messy YouTube URL (cleaned automatically)

Request:
  GET /download?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ&si=abc123&index=2&type=mp3

Response:
  { "download": "https://yt-downloader-ccprojects-production.up.railway.app/download/1743173841.mp3" }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NOTES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- The download link expires after ~6 hours.
- Supported formats: mp3, mp4, webm, m4a.
- The API uses the youtube-downloader-cc-api library (v1.0.4).
- No API key required.
  `);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
