module.exports = async function handler(req, res) {
  console.log('RUNNING VERSION 2');

  try {
    if (req.method !== 'POST') {
      return res.status(200).send('ok');
    }

    const body = req.body;
    console.log('BODY:', JSON.stringify(body));

    if (body.type === 'url_verification') {
      return res.status(200).json({ challenge: body.challenge });
    }

    if (body.type === 'event_callback') {
      console.log('EVENT CALLBACK RECEIVED');
      return res.status(200).send('ok');
    }

    return res.status(200).send('ok');
  } catch (error) {
    console.error('ERROR:', error);
    return res.status(200).send('error');
  }
};
