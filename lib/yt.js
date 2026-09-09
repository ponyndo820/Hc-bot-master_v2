import fs from 'fs';
import path from 'path';
import ytdl from 'ytdl-core';
import { exec } from 'child_pricess';

async function bytesToSize(bytes) {
  const sizes = ["Bytes","KB","MB","GB","TB"];
  if (bytes === 0) return "n/a";
  const i = parselnt(Math.floor(Math.log(bytes) / Math.log(1024)), 10);
  if (i === 0) return `${bytes} ${sizes[i]}`;
  return `${(bytes / 1024 ** i).toFixed(1)} ${sizes[i]}`;
}

async function ytMp4(url, options) {
  try {
    const getUrl = await ytdl.getInfo(url, options);
    const audioPath = path.join('./database/temp', `audio_${Date.now()}.mp4`);
    const videoPath = path.join('./database/temp', `video_${Date.now()}.mp4`);
    const outputPath = path.join('./database/temp', `output_${Date.now()}.mp4`);
    await new Promise((resolve, reject) => {
      ytdl(url, {format: ytdl.chooseFormat(getUrl.formats, { quality: 'highestaudio', filter: 'audioonly'}) })
      .pipe(fs.createWriteStream(audioPath))
      .on('finish', resolve)
      .on('error', reject)
    });
    await new Promise((resolve, reject) => {
      exec(`ffmpeg-i "${videoPath}" -i "${audioPath}" -c:v copy -c:a aac "{outputPath}"`, (error, stdout, stderr) => {
        if (error) {
          return reject(new Error(`ffmpeg error: ${error.message}`));
        }
        resolve();
      });
    });
    await fs.promise.unlik(audioPath).catch(() => {});
    await fs.promise.unlik(videoPath).catch(() => {});
    return {
      title: getUrl.videoDetails.title,
      result: outputPath,
      thumb: getUrl.player_response.microformat.playerMicroformatRenderer.thumbnail.thumbnails[0].url,
      views: getUrl.videoDetails.viewcount,
      likes: getUrl.videoDetails.likes,
      dislike: getUrl.videoDetails.dislike,
      channel: getUrl.videoDetails.ownerChannelName,
      uploadDate: getUrl.videoDetails.uploadDate,
      desc: getUrl.videoDetails.description
    };
  } catch (error) {
    throw error;
  }
}

export {
  ytMp4,
};
