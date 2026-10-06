/*
   * igdl.js
   * By Heart candy
   * Sc ini open source
   * ❗Peringatan Script ini tidak boleh di perjual belikan. Jika melanggar akan berurusan dengan hukum.
*/
import axios from 'axios';
import * as cheerio from 'cheerio';
import vm from 'node:vm';

const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
};

async function getMetadata(url) {
  try {
    const { data } = await axios.get(url, { headers });
    const $ = cheerio.load(data);

    const username =
      $('meta[property="instapp:owner_user_name"]').attr('content') ||
      $('meta[property="og:title"]').attr('content')?.split('•')[0]?.trim() ||
      '-';

    const caption =
      $('meta[property="og:description"]').attr('content') ||
      $('meta[name="description"]').attr('content') ||
      '-';

    return { username, caption };
  } catch {
    return { username: '-', caption: '-' };
  }
}

async function indown(url) {
  try {
    const { data: pageData, headers: resHeaders } = await axios.get(
      'https://indown.io/en1',
      { headers }
    );

    const $ = cheerio.load(pageData);
    const token = $('input[name="_token"]').val();

    const cookies = resHeaders['set-cookie']
      ?.map(v => v.split(';')[0])
      .join('; ');

    if (!token) throw 'Token tidak ditemukan';

    const params = new URLSearchParams();
    params.append('referer', 'https://indown.io/en1');
    params.append('locale', 'en');
    params.append('_token', token);
    params.append('link', url);
    params.append('p', 'i');

    const { data: result } = await axios.post(
      'https://indown.io/download',
      params,
      {
        headers: {
          ...headers,
          'Content-Type': 'application/x-www-form-urlencoded',
          Cookie: cookies || ''
        }
      }
    );

    const $$ = cheerio.load(result);
    const results = [];

    $$('video source[src], a[href]').each((_, el) => {
      let link = $$(el).attr('src') || $$(el).attr('href');
      if (!link) return;

      if (link.includes('/fetch?')) {
        try {
          link = decodeURIComponent(
            new URL(link).searchParams.get('url')
          );
        } catch {}
      }

      if (/cdninstagram\.com|fbcdn\.net/.test(link)) {
        results.push(link.replace(/&dl=1$/, ''));
      }
    });

    const unique = [...new Set(results)];
    if (!unique.length) throw 'Media kosong';

    return unique;
  } catch {
    return [];
  }
}

async function snapsave(url) {
  try {
    const form = new URLSearchParams();
    form.append('url', url);

    const { data } = await axios.post(
      'https://snapsave.app/id/action.php?lang=id',
      form,
      {
        headers: {
          ...headers,
          origin: 'https://snapsave.app',
          referer: 'https://snapsave.app/id/download-video-instagram'
        }
      }
    );

    const ctx = {
      window: {},
      document: {
        getElementById: () => ({ value: '' })
      },
      console,
      eval: (res) => res
    };

    vm.createContext(ctx);
    const decoded = vm.runInContext(data, ctx);

    const matches = decoded.match(
      /https:\/\/d\.rapidcdn\.app\/v2\?[^"]+/g
    );

    if (!matches?.length) throw 'Media kosong';

    return [
      ...new Set(
        matches.map(u => u.replace(/&amp;/g, '&'))
      )
    ];
  } catch {
    return [];
  }
}

async function igdl(url) {
  if (!url.includes('instagram.com'))
    throw new Error('URL bukan Instagram');

  const meta = await getMetadata(url);

  let media = await indown(url);
  if (!media.length) media = await snapsave(url);
  if (!media.length) throw new Error('Media tidak ditemukan atau akun di-private');
  
  if (url.includes('/reel/')) {
    media = [media[0]];
  }

  const formatted = media.map(u => ({
    type: u.includes('.mp4') ? 'video' : 'image',
    download: u
  }));

  return {
    author: meta,
    media: formatted
  };
}

export { igdl };
