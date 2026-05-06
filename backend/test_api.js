const http = require('http');

http.get('http://localhost:3000/eventos', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('STATUS:', res.statusCode);
    console.log('BODY:', data.substring(0, 500));
    try {
        const json = JSON.parse(data);
        console.log('COUNT:', Array.isArray(json) ? json.length : (json.data ? json.data.length : 'NOT AN ARRAY'));
    } catch (e) {
        console.log('NOT JSON');
    }
  });
}).on('error', (err) => {
  console.log('ERROR:', err.message);
});
