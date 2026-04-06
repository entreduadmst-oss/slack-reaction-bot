module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(200).send('ok');
    }

    const body = req.body;

    // Slack URL verification
    if (body.type === 'url_verification') {
      return res.status(200).json({ challenge: body.challenge });
    }

    // reactionイベントのみ処理
    if (body.type === 'event_callback') {
      const event = body.event;

      // reaction_added以外は無視
      if (event.type !== 'reaction_added') {
        return res.status(200).send('ok');
      }

      // :us: 以外は無視
      if (event.reaction !== 'us') {
        return res.status(200).send('ok');
      }

      const channel = event.item.channel;
      const ts = event.item.ts;

      const slackBotToken = process.env.SLACK_BOT_TOKEN;
      const deeplApiKey = process.env.DEEPL_API_KEY;
      const deeplApiBase = process.env.DEEPL_API_BASE || 'https://api-free.deepl.com';

      // 元メッセージ取得
      const message = await fetch('https://slack.com/api/conversations.history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${slackBotToken}`
        },
        body: JSON.stringify({
          channel: channel,
          latest: ts,
          inclusive: true,
          limit: 1
        })
      }).then(res => res.json());

      if (!message.ok || !message.messages.length) {
        return res.status(200).send('ok');
      }

      const originalText = message.messages[0].text;

      // 翻訳
      const translation = await fetch(`${deeplApiBase}/v2/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `DeepL-Auth-Key ${deeplApiKey}`
        },
        body: JSON.stringify({
          text: [originalText],
          target_lang: 'EN'
        })
      }).then(res => res.json());

      if (!translation.translations) {
        return res.status(200).send('ok');
      }

      const translatedText = translation.translations[0].text;

      // スレッド返信
      await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${slackBotToken}`
        },
        body: JSON.stringify({
          channel: channel,
          thread_ts: ts,
          text: `🇺🇸 Translation:\n${translatedText}`
        })
      });

      return res.status(200).send('ok');
    }

    return res.status(200).send('ok');

  } catch (error) {
    console.error(error);
    return res.status(200).send('ok');
  }
};
