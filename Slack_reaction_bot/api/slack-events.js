module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).send('ok');
  }

  const body = req.body;

  // Slack URL verification
  if (body && body.type === 'url_verification') {
    return res.status(200).json({ challenge: body.challenge });
  }

  return res.status(200).send('ok');
};