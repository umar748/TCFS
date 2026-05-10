import nodemailer from 'nodemailer';

// Generate Ethereal test account
async function createTestAccount() {
  try {
    const testAccount = await nodemailer.createTestAccount();

    console.log('=== ETHEREAL TEST EMAIL ACCOUNT ===');
    console.log('Email:', testAccount.user);
    console.log('Password:', testAccount.pass);
    console.log('SMTP Host:', testAccount.smtp.host);
    console.log('SMTP Port:', testAccount.smtp.port);
    console.log('');
    console.log('📧 Web Interface:', nodemailer.getTestMessageUrl(testAccount));
    console.log('');
    console.log('Add these to your backend/.env file:');
    console.log(`EMAIL_SERVICE=ethereal`);
    console.log(`EMAIL_USER=${testAccount.user}`);
    console.log(`EMAIL_PASSWORD=${testAccount.pass}`);
    console.log('');
    console.log('Then restart your backend server.');

  } catch (error) {
    console.error('Error creating test account:', error);
  }
}

createTestAccount();