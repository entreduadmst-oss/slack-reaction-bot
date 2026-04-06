module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(200).send('ok');
    }

    const body = req.body;
    console.log('BODY:', JSON.stringify(body));

    if (body.type === 'url_verification') {
      console.log('url_verification');
      return res.status(200).json({ challenge: body.challenge });
    }

    if (body.type !== 'event_callback') {
      console.log('skip: not event_callback');
      return res.status(200).send('ok');
    }

    const event = body.event;
    console.log('EVENT TYPE:', event?.type);
    console.log('REACTION:', event?.reaction);

    if (event?.type !== 'reaction_added') {
      console.log('skip: not reaction_added');
      return res.status(200).send('ok');
    }

    if (!['flag-us', 'us'].includes(event.reaction)) {
      console.log('skip: not us reaction');
      return res.status(200).send('ok');
    }

    const channel = event.item?.channel;
    const ts = event.item?.ts;
    const slackBotToken = process.env.SLACK_BOT_TOKEN;

    console.log('CHANNEL:', channel);
    console.log('TS:', ts);
    console.log('HAS TOKEN:', !!slackBotToken);

    const postRes = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${slackBotToken}`
      },
      body: JSON.stringify({
        channel,
        thread_ts: ts,
        text: 'test reply from bot'
      })
    });

    const postData = await postRes.json();
    console.log('POST MESSAGE:', JSON.stringify(postData));

    return res.status(200).send('ok');
  } catch (error) {
    console.error('ERROR:', error);
    return res.status(200).send('ok');
  }
};
