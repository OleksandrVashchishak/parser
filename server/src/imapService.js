const imaps = require('imap-simple');
const axios = require('axios');
const { getAccounts, saveMessageId, isMessageProcessed, addLog } = require('./db');
const { extractTextFromContent } = require('./helpers/extractTextFromContent');

async function fetchLatestEmails() {
  const accounts = await getAccounts(); // Отримуємо всі облікові записи з бази даних
  for (const account of accounts) {
    const config = {
      imap: {
        user: account.user,
        password: account.password,
        host: 'imap.gmail.com',
        port: 993,
        tls: true,
        authTimeout: 30000,
        tlsOptions: { rejectUnauthorized: false },
      },
    };

    const connection = await imaps.connect(config);
    const boxes = await connection.getBoxes();
    const allMailFolder = Object.keys(boxes['[Gmail]'].children || {}).find(
      (folder) => {
        return folder === 'All Mail' || folder === 'Уся пошта' || folder === 'Вся пошта'
      });

    if (!allMailFolder) {
      console.log('Папка "Уся пошта" недоступна для цього облікового запису.');
      addLog(account.user, 'Папка "Уся пошта" недоступна для цього облікового запису.')
      connection.end();
    }
    const allMailPath = `[Gmail]/${allMailFolder}`;
    await connection.openBox(allMailPath);

    const delay = 12 * 3600 * 1000; // 12 годин в мілісекундах
    const sinceDate = new Date(Date.now() - delay).toISOString();

    const searchCriteria = ['ALL', ['SINCE', sinceDate]];
    const fetchOptions = {
      bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)', 'TEXT'],
      markSeen: false,
      struct: true,
    };

    const messages = await connection.search(searchCriteria, fetchOptions);

    let newMessageCount = 0;

    for (const message of messages) {
      const header = message.parts.find((part) =>
        part.which.includes('HEADER.FIELDS')
      );
      const textPart = message.parts.find((part) => part.which === 'TEXT');
      const messageId = message.attributes.uid;

      const isProcessed = await isMessageProcessed(messageId, account.user);
      if (isProcessed) continue;

      newMessageCount++;


      const label = message?.attributes['x-gm-labels'][0]
      const subject = header?.body?.subject?.[0] || 'Без теми';
      const from = header?.body?.from?.[0] || 'Невідомо';
      const to = header?.body?.to?.[0] || 'Невідомо';
      const date = header?.body?.date?.[0] || new Date().toISOString();
      const text = textPart ? textPart.body : 'Без тексту';

      const data = {
        event_type: label === '\\Sent' ? 'sent' : 'inbox',
        date,
        from_email: from.match(/<(.+?)>/)[1],
        lead_email: to.match(/<(.+?)>/) ? to.match(/<(.+?)>/)[1] : to,
        subject,
        text: extractTextFromContent(text)[0],
        // campaign_name: 'SL A&P_US&CA_MSother', 
        // sequence_number: '2',
        // app_url: 'http://example.com/email-link',
      };


      // console.log('Відправляємо запит з даними:', data);
      if (true) {
        addLog(account.user, `Sending to API...`)
        try {
          const post_query = await axios.post('https://us-central1-fortesvision.cloudfunctions.net/autoemails', data, {
            headers: {
              'Content-Type': 'application/json',
            },
          });
          console.log('RESPONSE:', post_query.data, post_query.status);
          addLog(account.user, `Successfully sent to API: status ${post_query.status}`)
        } catch (error) {
          console.error('Помилка під час відправки запиту:', error.message);
          addLog(account.user, `Error sending request to API: ${error.message}`)

          if (error.response) {
            console.error('Код помилки:', error.response.status);
            console.error('Дані помилки:', error.response.data);
          }
        }
      }

      // Зберігаємо ID повідомлення в базу даних
      await saveMessageId(messageId, account.user);
    }

    console.log(`Number of new messages in the last 12 hours: ${newMessageCount}`);
    addLog(account.user, `Number of new messages in the last 12 hours: ${newMessageCount}`)

    connection.end();

  }

}

module.exports = { fetchLatestEmails };
