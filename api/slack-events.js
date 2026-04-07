module.exports = async function handler(req, res) {
  console.log('RUNNING VERSION 4');

  try {
    if (req.method !== 'POST') {
      return res.status(200).send('ok');
    }

    let body = req.body;

    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        console.log('BODY STRING PARSE FAILED');
      }
    }

    console.log('BODY:', JSON.stringify(body));

    if (body.type === 'url_verification') {
      return res.status(200).json({ challenge: body.challenge });
    }

    if (body.type !== 'event_callback') {
      return res.status(200).send('ok');
    }

    const event = body.event;
    console.log('EVENT:', JSON.stringify(event));

    if (!event || event.type !== 'reaction_added') {
      console.log('skip: not reaction_added');
      return res.status(200).send('ok');
    }

    if (!['flag-us', 'us'].includes(event.reaction)) {
      console.log('skip: not US reaction');
      return res.status(200).send('ok');
    }

    const channel = event.item?.channel;
    const ts = event.item?.ts;

    const slackBotToken = process.env.SLACK_BOT_TOKEN;
    const deeplApiKey = process.env.DEEPL_API_KEY;
    const deeplApiBase = process.env.DEEPL_API_BASE || 'https://api-free.deepl.com';

    console.log('CHANNEL:', channel);
    console.log('TS:', ts);
    console.log('HAS SLACK TOKEN:', !!slackBotToken);
    console.log('HAS DEEPL KEY:', !!deeplApiKey);

    // 元メッセージ取得
    const historyRes = await fetch('https://slack.com/api/conversations.history', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${slackBotToken}`
      },
      body: JSON.stringify({
        channel,
        latest: ts,
        inclusive: true,
        limit: 1
      })
    });

    const historyData = await historyRes.json();
    console.log('HISTORY:', JSON.stringify(historyData));

    if (!historyData.ok || !historyData.messages || historyData.messages.length === 0) {
      console.log('stop: failed to fetch original message');
      return res.status(200).send('ok');
    }

    const message = historyData.messages[0];

    if (message.bot_id || message.subtype === 'bot_message') {
      console.log('stop: bot message');
      return res.status(200).send('ok');
    }

    const originalText = message.text;
    console.log('ORIGINAL TEXT:', originalText);

    if (!originalText) {
      console.log('stop: no text');
      return res.status(200).send('ok');
    }

    // DeepL翻訳
    const deeplRes = await fetch(`${deeplApiBase}/v2/translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `DeepL-Auth-Key ${deeplApiKey}`
      },
      body: JSON.stringify({
        text: [originalText],
        target_lang: 'EN'
      })
    });

    const deeplData = await deeplRes.json();
    console.log('DEEPL:', JSON.stringify(deeplData));

    if (!deeplData.translations || deeplData.translations.length === 0) {
      console.log('stop: translation failed');
      return res.status(200).send('ok');
    }

    const translatedText = deeplData.translations[0].text;

    // スレッド返信
    const postRes = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${slackBotToken}`
      },
      body: JSON.stringify({
        channel,
        thread_ts: ts,
        text: `🇺🇸 Translation:\n${translatedText}`
      })
    });

    const postData = await postRes.json();
    console.log('POST MESSAGE:', JSON.stringify(postData));

    return res.status(200).send('ok');
  } catch (error) {
    console.error('ERROR:', error);
    return res.status(200).send('error');
  }
};
