const https = require('https');
const fs = require('fs');

https.get('https://postimg.cc/pyrFJq6t', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    const match = data.match(/<meta property="og:image" content="(.*?)"/);
    if (match && match[1]) {
      const imgUrl = match[1];
      console.log('Found image URL:', imgUrl);
      https.get(imgUrl, (imgRes) => {
        const file = fs.createWriteStream('./public/mapa-estatico.webp');
        imgRes.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log('Download complete');
        });
      });
    } else {
      console.log('Image URL not found');
    }
  });
}).on('error', (err) => {
  console.log('Error: ', err.message);
});
