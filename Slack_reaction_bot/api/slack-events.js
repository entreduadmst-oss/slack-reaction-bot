module.exports = async function handler(req, res) {
  try {
    // POST以外は無視
    if (req.method !== 'POST') {
      return res.status(200).send('ok');
    }

    const body = req.body;

    // SlackのURL検証
    if (body.type === 'url_verification') {
      return res.status(200).json({ challenge: body.challenge });
    }

    // イベント処理
    if (body.type === 'event_callback') {
      const event = body.event;

      // reaction_addedのみ処理
      if (event.type !== 'reaction_added') {
        return res.status(200).send('ok');
      }

      // :flag-us: のときだけ動作
      if (event.reaction !== 'flag-us') {
        return res.status(200).send('ok');
      }

      const channel = event.item.channel;
      const ts = event.item.ts;

      const slackBotToken = process.env.SLACK_BOT_TOKEN;
      const deeplApiKey = process.env.DEEPL_API_KEY;
      const deeplApiBase = process.env.DEEPL_API_BASE || 'https://api-free.deepl.com';

      // 元メッセージ取得
      const historyRes = await fetch('https://slack.com/api/conversations.history', {
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
      });

      const historyData = await historyRes.json();

      if (!historyData.ok || !historyData.messages.length) {
        return res.status(200).send('ok');
      }

      const message = historyData.messages[0];

      // Bot投稿は無視（無限ループ防止）
      if (message.bot_id || message.subtype === 'bot_message') {
        return res.status(200).send('ok');
      }

      const originalText = message.text;

      if (!originalText) {
        return res.status(200).send('ok');
      }

      // DeepL翻訳（英語）
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

      if (!deeplData.translations || !deeplData.translations.length) {
        return res.status(200).send('ok');
      }

      const translatedText = deeplData.translations[0].text;

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
    console.error('ERROR:', error);
    return res.status(200).send('ok');
  }
};
