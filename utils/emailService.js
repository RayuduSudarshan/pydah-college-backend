const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({  // Fixed: createTransport instead of createTransporter
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

function sendOTPEmail(email, otp) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Pydah College - OTP Verification',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #FF7F00;">Pydah Engineering College</h2>
        <p>Your OTP for registration is:</p>
        <h1 style="background: #FF7F00; color: white; padding: 10px; border-radius: 5px; text-align: center;">
          ${otp}
        </h1>
        <p>This OTP will expire in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
}

module.exports = { sendOTPEmail };