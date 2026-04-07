module.exports = async function handler(req, res) {
  console.log('RUNNING VERSION 1');

  if (req.method === 'GET') {
    return res.status(200).send('OK');
  }

  return res.status(200).send('POST OK');
};
