const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const DOWNLOAD_DIR = '/tmp';
const EXPIRE_MS = 6 * 60 * 60 * 1000;

function cleanYouTubeUrl(url) {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  return match ? `https://youtu.be/${match[1]}` : null;
}

setInterval(() => {
  fs.readdir(DOWNLOAD_DIR, (err, files) => {
    if (err) return;
    files.forEach(file => {
      if (file.startsWith('yt_')) {
        const filePath = path.join(DOWNLOAD_DIR, file);
        fs.stat(filePath, (err, stats) => {
          if (err) return;
          if (Date.now() - stats.mtimeMs > EXPIRE_MS) {
            fs.unlink(filePath, () => {});
          }
        });
      }
    });
  });
}, 30 * 60 * 1000);

app.get('/download', async (req, res) => {
  const { url, raw = 'false' } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Missing "url" parameter' });
  }

  const cleanUrl = cleanYouTubeUrl(url);
  if (!cleanUrl) {
    return res.status(400).json({ error: 'Invalid YouTube URL' });
  }

  const randomName = `yt_${crypto.randomBytes(8).toString('hex')}.mp3`;
  const outputPath = path.join(DOWNLOAD_DIR, randomName);
  const command = `yt-dlp -f bestaudio --extract-audio --audio-format mp3 --audio-quality 0 -o "${outputPath}" "${cleanUrl}"`;

  exec(command, { timeout: 120000 }, (error) => {
    if (error) {
      console.error(error);
      return res.status(500).json({ error: 'Download failed' });
    }

    const fileUrl = `${req.protocol}://${req.get('host')}/file/${randomName}`;
    if (raw === 'true') {
      res.type('text/plain').send(fileUrl);
    } else {
      res.json({ download: fileUrl });
    }
  });
});

app.get('/file/:filename', (req, res) => {
  const filePath = path.join(DOWNLOAD_DIR, req.params.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found or expired' });
  }
  res.sendFile(filePath);
});

app.get('/docs', (req, res) => {
  res.type('text/plain');
  res.send(`
YouTube to MP3 Direct Download API

How to use:

1. Make a GET request to /download with the YouTube URL.
   Example:
   https://your-app.onrender.com/download?url=https://youtu.be/rFAVe1fUppc

2. You will receive a JSON response:
   { "download": "https://your-app.onrender.com/file/yt_xxxxx.mp3" }

3. Use that link directly in your game or share it with friends.

Optional parameters:
   &raw=true  → returns only the download URL as plain text (no JSON).
   Example: https://your-app.onrender.com/download?url=...&raw=true

Important:
   - The download link expires after 6 hours.
   - Only MP3 format is supported.
   - The video must be publicly available.
  `);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
