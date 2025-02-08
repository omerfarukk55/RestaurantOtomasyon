const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: true,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

const sendOrderConfirmation = async (order) => {
    try {
        await transporter.sendMail({
            from: process.env.SMTP_FROM,
            to: order.user_email,
            subject: 'Sipariş Onayı',
            html: `Siparişiniz alındı. Sipariş numaranız: ${order.order_number}`
        });
    } catch (error) {
        console.error('Email gönderilemedi:', error);
    }
};

module.exports = { sendOrderConfirmation };