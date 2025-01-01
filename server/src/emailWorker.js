const nodeCron = require('node-cron');
const { fetchLatestEmails } = require('./imapService');
const { getAccounts, getSetting, addLog } = require('./db');


async function checkEmails() {
  try {
    console.log('Starting email check...');

    const isEnabled = await getSetting('email_worker_enabled');
    console.log(isEnabled, 'isEnabled');

    if (!isEnabled) {
      console.log('Email worker is disabled. Skipping email check.');
      addLog('SYSTEM', 'Email worker is disabled. Skipping email check.');
      return;
    }

    const accounts = await getAccounts();

    if (accounts.length === 0) {
      console.log('No accounts found. Add accounts to start email processing.');
      return;
    }

    for (const account of accounts) {
      console.log(`Checking emails for account: ${account.user}`);
      addLog(account.user, 'Checking emails');

      try {
        await fetchLatestEmails(account);
      } catch (error) {
        console.error(`Error fetching emails for account ${account.user}:`, error);
        addLog(account.user, `Error fetching emails: ${error}`);
      }
    }

    console.log('Email check completed.');
  } catch (error) {
    console.error('Error in email checking process:', error);
  }
}

function startWorker() {
  checkEmails()
  nodeCron.schedule('*/30 * * * *', async () => {
    console.log('Cron job triggered: Checking emails...');
    await checkEmails();
  });
}

module.exports = { startWorker };
