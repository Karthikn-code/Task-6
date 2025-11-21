const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Serve static files (index.html, styles.css, script.js)
app.use(express.static(path.join(__dirname)));

function validateEmail(email){
  const re = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  return re.test(String(email).toLowerCase());
}

async function createTransporter(){
  // If SMTP settings are provided via env, use them. Otherwise fall back to Ethereal test account.
  if(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS){
    const secure = Number(process.env.SMTP_PORT) === 465;
    return { transporter: nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
      secure,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    }), isEthereal: false };
  }

  // Create ethereal test account
  const testAccount = await nodemailer.createTestAccount();
  const transporter = nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: { user: testAccount.user, pass: testAccount.pass }
  });
  return { transporter, isEthereal: true, testAccount };
}

app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body || {};
  const errors = {};

  if(!name || !String(name).trim()) errors.name = 'Please enter your name.';
  if(!email || !String(email).trim()) errors.email = 'Please enter your email.';
  else if(!validateEmail(email)) errors.email = 'Please enter a valid email address.';
  if(!message || !String(message).trim()) errors.message = 'Please enter a message.';

  if(Object.keys(errors).length) return res.status(400).json({ success: false, errors });

  try{
    const { transporter, isEthereal } = await createTransporter();

    const fromAddress = process.env.FROM_EMAIL || `no-reply@${req.hostname || 'localhost'}`;
    const ownerAddress = process.env.SITE_OWNER_EMAIL || null;

    const mailToUser = {
      from: fromAddress,
      to: email,
      subject: `Thanks for contacting us, ${name}`,
      text: `Hi ${name},\n\nThanks for your message:\n\n${message}\n\nWe will get back to you shortly.\n`
    };

    const mailToOwner = ownerAddress ? {
      from: fromAddress,
      to: ownerAddress,
      subject: `New contact from ${name} <${email}>`,
      text: `Message from ${name} <${email}>:\n\n${message}\n`
    } : null;

    const sendPromises = [transporter.sendMail(mailToUser)];
    if(mailToOwner) sendPromises.push(transporter.sendMail(mailToOwner));

    const results = await Promise.all(sendPromises);

    const response = { success: true };
    if(isEthereal){
      response.previewUrls = results.map(r => nodemailer.getTestMessageUrl(r)).filter(Boolean);
    }

    return res.json(response);
  }catch(err){
    console.error('Error sending email:', err);
    return res.status(500).json({ success: false, error: 'Failed to send email' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
