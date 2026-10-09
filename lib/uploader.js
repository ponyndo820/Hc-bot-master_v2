/*
   * uploader.js
   * By Heart candy
   * Sc ini open source
   * ❗Peringatan Script ini tidak boleh di perjual belikan. Jika melanggar akan berurusan dengan hukum.
*/
import fs from 'fs';
import axios from 'axios';
import cheerio from 'cheerio';
import BodyForm from 'form-data';
import * as FileType from 'file-type';

async function UguuSe(filePath) {
  return new Promise(async (resolve, reject) => {
    try {
      const from = new FormData();
      const fileType = await FileType.fromFile(filePath);
      const ext = fileType ? fileType.ext : 'bin';
      form.append('files[]', fs.createReadStream(filePath), { filename: 'data.' + ext });
      const data = await axios.post('https://uguu.se/upload.php', form, {
        headers: {
          ...form.getHeaders()
        }
      })
      resolve(data.data.files[0])
    } catch (e) {
      reject(e)
    }
  })
}

function webp2mp4File(path) {
    return new Promise((resolve, reject) => {
         const form = new BodyForm();
         form.append('new-image-url', '');
         form.append('new-image', fs.createReadStream(path));
         axios({
              method: 'post',
              url: 'https://s6.ezgif.com/webp-to-mp4',
              data: form,
              headers: {
                   'Content-Type': `multipart/form-data; boundary=${form._boundary}`
              }
         }).then(({ data }) => {
              const bodyFormThen = new BodyForm();
              const $ = cheerio.load(data);
              const file = $('input[name="file"]').attr('value');
              bodyFormThen.append('file', file);
              bodyFormThen.append('convert', "Convert WebP to MP4!");
              axios({
                   method: 'post',
                   url: 'https://ezgif.com/webp-to-mp4/' + file,
                   data: bodyFormThen,
                   headers: {
                        'Content-Type': `multipart/form-data; boundary=${bodyFormThen._boundary}`
                   }
              }).then(({ data }) => {
                   const $ = cheerio.load(data);
                   const result = 'https:' + $('div#output > p.outfile > video > source').attr('src');
                   resolve({
                        status: true,
                        message: "Xeorz",
                        result: result
                   });
              }).catch(reject);
         }).catch(reject);
    });
}


export { UguuSe, webp2mp4File }