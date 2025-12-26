import { products } from './products.js';

/**
 * Manages the checkout process, payment selection, and order notifications.
 */
export class CheckoutManager {
  constructor() {
    this.selectedPaymentMethod = null;
  }

  /**
   * Step 1: Select the payment method.
   * @param {string} method - The payment method (e.g., 'credit_card', 'paypal').
   */
  selectPaymentMethod(method) {
    const validMethods = ['credit_card', 'paypal', 'bank_transfer'];
    if (!validMethods.includes(method)) {
      throw new Error(`Invalid payment method. Allowed: ${validMethods.join(', ')}`);
    }
    this.selectedPaymentMethod = method;
    console.log(`Payment method selected: ${this.selectedPaymentMethod}`);
  }

  /**
   * Step 2: Place the order.
   * Calculates total, processes payment, and triggers email notification.
   * @param {Array} cartItems - Array of { id: number, quantity: number }.
   * @param {string} userEmail - The customer's email address.
   * @param {Function} [onProgress] - Optional callback for status updates.
   */
  async placeOrder(cartItems, userEmail, onProgress) {
    if (!this.selectedPaymentMethod) {
      throw new Error('Please select a payment method before placing the order.');
    }

    if (!cartItems || cartItems.length === 0) {
      throw new Error('Cannot place order: Cart is empty.');
    }

    // 1. Calculate Order Details
    const orderDetails = this._calculateOrder(cartItems);

    // 2. Process Payment
    if (onProgress) onProgress('Processing payment...');
    await this._processPayment(orderDetails.total);

    // 3. Send Email Notification
    if (onProgress) onProgress('Sending confirmation email...');
    const emailContent = await this._sendEmailNotification(userEmail, orderDetails);

    return { orderDetails, emailContent };
  }

  _calculateOrder(cartItems) {
    let total = 0;
    const items = [];

    for (const cartItem of cartItems) {
      const product = products.find(p => p.id === cartItem.id);
      if (product) {
        const itemTotal = product.price * cartItem.quantity;
        total += itemTotal;
        items.push({
          name: product.name,
          quantity: cartItem.quantity,
          price: product.price,
          total: itemTotal
        });
      }
    }

    return {
      orderId: `ORD-${Date.now()}`,
      date: new Date().toISOString(),
      paymentMethod: this.selectedPaymentMethod,
      items,
      total: parseFloat(total.toFixed(2))
    };
  }

  async _processPayment(amount) {
    console.log(`Processing payment of $${amount} via ${this.selectedPaymentMethod}...`);
    return new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
  }

  async _sendEmailNotification(email, order) {
    const orderHistory = JSON.parse(localStorage.getItem('orderHistory') || '[]');
    orderHistory.push({ ...order, email });
    localStorage.setItem('orderHistory', JSON.stringify(orderHistory));
    
    try {
      const response = await fetch('http://localhost:3001/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, order })
      });

      if (!response.ok) {
        throw new Error('Failed to connect to email server');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Email sending failed');
      }

      return result.html;
    } catch (error) {
      console.error('Email Error:', error);
      if (error.message === 'Failed to fetch') {
        throw new Error('Connection failed. Please ensure the backend server is running on port 3001 (npm run server).');
      }
      throw new Error(`Could not send email: ${error.message}`);
    }
  }
}