import fs from 'fs';
import path from 'path';
import youtubedl from 'youtube-dl-exec';

async function ytMp4(url) {
  try {
    const outputPath = path.join('./database/temp', `video_${Date.now()}.mp4`);
    const info = await youtubedl(url, {
      dumpSingleJson: true,
      noCheckCertificates: true,
      noWarnings: true,
      addHeader: ['referer:https://www.youtube.com']
    });
    
    await youtubedl(url, {
      output: outputPath,
      format: 'best', 
      noCheckCertificates: true,
      noWarnings: true,
      addHeader: ['referer:https://www.youtube.com']
    });
    
    return {
      title: info.title,
      result: outputPath,
      thumb: info.thumbnail,
      views: info.view_count || '0',
      likes: info.like_count || '0',
      channel: info.uploader || '-',
      uploadDate: info.upload_date || '-',
      desc: info.description || ''
    };
  } catch (error) {
    throw error;
  }
}

export { ytMp4 };
