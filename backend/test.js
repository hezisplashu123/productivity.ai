const https = require('https');

const dataEnsure = JSON.stringify({ userId: 'test-user-123' });

const optionsEnsure = {
  hostname: 'hezi-backend.onrender.com',
  port: 443,
  path: '/profile/ensure',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': dataEnsure.length
  }
};

const reqEnsure = https.request(optionsEnsure, resEnsure => {
  let bodyEnsure = '';
  resEnsure.on('data', d => { bodyEnsure += d; });
  resEnsure.on('end', () => {
    const profile = JSON.parse(bodyEnsure);
    console.log('Profile created:', profile.id);
    
    const data = JSON.stringify({
      profileId: profile.id,
      gamemode: 'family',
      categoryId: 'family-icebreakers',
      count: 5,
      playerCount: 3
    });

    const options = {
      hostname: 'hezi-backend.onrender.com',
      port: 443,
      path: '/profile/next-prompt',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, res => {
      let body = '';
      res.on('data', d => { body += d; });
      res.on('end', () => {
        console.log('Status:', res.statusCode);
        console.log('Response:', body);
      });
    });

    req.write(data);
    req.end();
  });
});

reqEnsure.write(dataEnsure);
reqEnsure.end();
