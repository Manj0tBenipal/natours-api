const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const emailOptions = {
    from: 'Manjot Singh <hello@manjot.io>',
    to: options.email,
    subject: options.subject,
    text: options.text,
  };
  await transporter.sendMail(emailOptions);
};
module.exports = sendEmail;
//{
//     service: 'Gmail',
//     host: 'smtp.gmail.com',
//     port: 465,
//     secure: true,
//     auth: {
//       user: process.env.EMAIL_USERNAME,
//       password: process.env.EMAIL_PASSWORD,
//     },
//}
