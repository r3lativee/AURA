const nodemailer = require('nodemailer');
const config = require('../config');

// Create a transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: config.EMAIL_USER || 'your-email@gmail.com',
    pass: config.EMAIL_PASSWORD || 'your-app-password'
  }
});

/**
 * Send order confirmation email to user
 * @param {Object} order - Order details
 * @param {Object} user - User details
 * @returns {Promise} - Email sending result
 */
const sendOrderConfirmation = async (order, user) => {
  try {
    // Format order items for email
    const itemsList = order.items.map(item => 
      `<tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">₹${item.price.toFixed(2)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">₹${(item.price * item.quantity).toFixed(2)}</td>
      </tr>`
    ).join('');

    // Format address
    const address = `${order.shippingAddress.street}, ${order.shippingAddress.city}, 
                    ${order.shippingAddress.state}, ${order.shippingAddress.pincode}, 
                    ${order.shippingAddress.country}`;

    // Create email content
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; background-color: #f9f9f9;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #333;">Order Confirmation</h1>
          <p>Thank you for your order!</p>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h2 style="color: #333;">Order Details</h2>
          <p><strong>Order ID:</strong> ${order._id}</p>
          <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
          <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
          <p><strong>Payment Status:</strong> ${order.isPaid ? 'Paid' : 'Pending'}</p>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h2 style="color: #333;">Shipping Information</h2>
          <p><strong>Name:</strong> ${user.name}</p>
          <p><strong>Address:</strong> ${address}</p>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h2 style="color: #333;">Order Summary</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f2f2f2;">
                <th style="padding: 10px; text-align: left;">Product</th>
                <th style="padding: 10px; text-align: left;">Quantity</th>
                <th style="padding: 10px; text-align: left;">Price</th>
                <th style="padding: 10px; text-align: left;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsList}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" style="padding: 10px; text-align: right; font-weight: bold;">Total:</td>
                <td style="padding: 10px; font-weight: bold;">₹${order.totalAmount.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        
        <div style="margin-top: 30px; text-align: center; color: #777; font-size: 14px;">
          <p>If you have any questions about your order, please contact our customer support.</p>
          <p>© ${new Date().getFullYear()} AURA. All rights reserved.</p>
        </div>
      </div>
    `;

    // Email options
    const mailOptions = {
      from: config.EMAIL_USER || 'AURA <your-email@gmail.com>',
      to: user.email,
      subject: `AURA - Order Confirmation #${order._id}`,
      html: emailContent
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('Order confirmation email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    // Don't throw the error, just log it to prevent blocking the order process
    return null;
  }
};

module.exports = {
  sendOrderConfirmation
}; 