module.exports = async function handler(req, res) {
  console.log('RUNNING VERSION 7');

  try {
    if (req.method === 'GET') {
      return res.status(200).send('VERSION 7 OK');
    }

    let body = req.body;

    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        console.log('BODY STRING PARSE FAILED');
      }
    }

    console.log('METHOD:', req.method);
    console.log('BODY:', JSON.stringify(body));

    if (body && body.type === 'url_verification') {
      console.log('URL VERIFICATION');
      return res.status(200).json({ challenge: body.challenge });
    }

    if (body && body.type === 'event_callback') {
      console.log('EVENT CALLBACK RECEIVED');
      console.log('EVENT:', JSON.stringify(body.event));
      return res.status(200).send('ok');
    }

    return res.status(200).send('ok');
  } catch (error) {
    console.error('ERROR:', error);
    return res.status(200).send('error');
  }
};
