import express from 'express';
import nodemailer from 'nodemailer';
import cors from 'cors';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Email Configuration
// REPLACE these values with your actual Yahoo credentials
const transporter = nodemailer.createTransport({
  service: 'yahoo',
  auth: {
    user: 'geronimo.isaias@yahoo.com', // Your full Yahoo email address
    pass: 'vtwnpshnxlpmuvtw'      // A generated App Password (NOT your login password)
  }
});

app.post('/api/send-email', async (req, res) => {
  const { email, order } = req.body;

  if (!email || !order) {
    return res.status(400).json({ success: false, error: 'Missing details' });
  }

  // Generate HTML for the email (Inline styles for best email client support)
  const htmlContent = `
    <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
      <div style="border-bottom: 1px solid #eee; padding-bottom: 15px; margin-bottom: 15px;">
        <h1 style="color: #4f46e5; font-size: 24px; margin: 0;">Order Confirmed</h1>
        <p style="color: #666; font-size: 14px; margin: 5px 0 0;">Order #${order.orderId}</p>
      </div>
      
      <p>Hi ${email}, thank you for your purchase!</p>
      
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="border-bottom: 2px solid #eee; text-align: left;">
            <th style="padding: 10px 0;">Item</th>
            <th style="padding: 10px 0; text-align: right;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${order.items.map(item => `
            <tr style="border-bottom: 1px solid #f5f5f5;">
              <td style="padding: 10px 0;">${item.name} x${item.quantity}</td>
              <td style="padding: 10px 0; text-align: right;">$${item.total.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr style="font-weight: bold;">
            <td style="padding: 15px 0;">Total</td>
            <td style="padding: 15px 0; text-align: right;">$${order.total.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
      
      <p style="font-size: 12px; color: #999;">Payment Method: ${order.paymentMethod.replace('_', ' ')}</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: transporter.options.auth.user,
      to: email,
      subject: `Order Confirmation ${order.orderId}`,
      html: htmlContent
    });
    console.log(`Email sent to ${email}`);
    res.json({ success: true, html: htmlContent });
  } catch (error) {
    console.error('Email error:', error);
    // Specific help for authentication errors
    if (error.code === 'EAUTH' || error.response?.includes('Too many bad auth attempts')) {
      console.error('\n>>> AUTH ERROR: Yahoo has blocked this login. Wait 30 mins, check your App Password, and try again.\n');
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});