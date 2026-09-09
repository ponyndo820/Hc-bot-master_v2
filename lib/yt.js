import fs from 'fs';
import path from 'path';
import youtubedl from 'youtube-dl-exec';

function formatDate(dateStr) {
  if (!dateStr || dateStr.length !== 8) return dateStr || '-';
  return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
}

async function ytMp4(url) {
  try {
    const outputPath = path.join('./database/temp', `video_${Date.now()}.mp4`);
    
    const info = await youtubedl(url, {
      dumpSingleJson: true,
      noCheckCertificates: true,
      noWarnings: true,
      extractorArgs: 'youtube:player_client=android,web',
      addHeader: ['referer:https://www.youtube.com']
    });
    
    await youtubedl(url, {
      output: outputPath,
      format: 'bestvideo+bestaudio/best',
      mergeOutputFormat: 'mp4',
      noCheckCertificates: true,
      noWarnings: true,
      extractorArgs: 'youtube:player_client=android,web',
      addHeader: ['referer:https://www.youtube.com']
    });
    
    return {
      title: info.title,
      result: outputPath,
      thumb: info.thumbnail,
      views: info.view_count || '0',
      likes: info.like_count || '0',
      channel: info.uploader || '-',
      uploadDate: formatDate(info.upload_date),
      desc: info.description || ''
    };
  } catch (error) {
    throw error;
  }
}

export { ytMp4 };
