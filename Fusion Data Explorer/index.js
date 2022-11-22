import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import axios from 'axios';
import cookieSession from 'cookie-session';

let app = express();

app.use(cookieSession({
  name: 'aps_session',
  keys: ['aps_secure_key'],
  maxAge: 60 * 60 * 1000 // 1 hour like the token
}));

let clientId = process.env.APS_CLIENT_ID || "YOUR CLIENT ID";
let clientSecret = process.env.APS_CLIENT_SECRET || "YOUR CLIENT SECRET";
let serverPort = process.env.PORT || 3000;
let callbackUrl = process.env.APS_CALLBACK_URL || `http://localhost:${serverPort}/callback/oauth`;

app.get('/callback/oauth', async (req, res) => {
  const { code } = req.query;

  try {
    const response = await axios({
      method: 'POST',
      url: 'https://developer.api.autodesk.com/authentication/v1/gettoken',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: `client_id=${clientId}&client_secret=${clientSecret}&grant_type=authorization_code&code=${code}&redirect_uri=${callbackUrl}`
    })

    req.session = {
      access_token: response.data.access_token
    };

    res.redirect('/');
  } catch (error) {
    console.log(error);
    res.end();
  }    
});

app.get('/oauth/token', async (req, res) => {
  if (!req.session?.access_token) {
    res.status(401).end();
    return;
  }

  res.end(req.session.access_token);
});

app.get('/oauth/url', (req, res) => {
  const url =
      'https://developer.api.autodesk.com' +
      '/authentication/v1/authorize?response_type=code' +
      '&client_id=' + clientId +
      '&redirect_uri=' + callbackUrl +
      '&scope=data:read data:write data:create';
  res.end(url);
});

app.use(express.static(path.join(path.dirname(fileURLToPath(import.meta.url)), 'public')));

app.listen(serverPort);

console.log(`Open http://localhost:${serverPort} in a web browser in order to log in with your Autodesk account!`);