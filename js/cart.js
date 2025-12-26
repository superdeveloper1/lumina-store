import { products } from './products.js';

export class Cart {
  constructor() {
    this.items = [];
    this.subscribers = [];
    this.init();

    // Sync across tabs to prevent zombie carts
    window.addEventListener('storage', (e) => {
      if (e.key === 'cart') {
        this.init();
        this.notify();
      }
    });
  }

  init() {
    try {
      const stored = JSON.parse(sessionStorage.getItem('cart'));
      if (Array.isArray(stored)) {
        // Deduplicate and merge quantities
        const itemMap = new Map();
        
        stored.forEach(item => {
          if (item && item.id) {
            const id = Number(item.id);
            const qty = Number(item.quantity) || 1;
            const product = products.find(p => p.id === id);
            
            if (product) {
              if (itemMap.has(id)) {
                itemMap.get(id).quantity += qty;
              } else {
                // Use fresh product data (image, price, name) + stored quantity
                itemMap.set(id, { ...product, quantity: qty });
              }
            }
          }
        });
        this.items = Array.from(itemMap.values());
      } else {
        this.items = [];
      }
    } catch (e) {
      this.items = [];
    }
  }

  addItem(product) {
    // Ensure we compare IDs as numbers to avoid duplicates if types mismatch
    const id = Number(product.id);
    const existingItem = this.items.find(item => item.id === id);
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      this.items.push({ ...product, id, quantity: 1 });
    }
    this.save();
  }

  removeItem(productId) {
    this.items = this.items.filter(item => item.id !== productId);
    this.save();
  }

  updateQuantity(productId, quantity) {
    const item = this.items.find(item => item.id === productId);
    if (item) {
      item.quantity = Math.max(0, quantity);
      if (item.quantity === 0) {
        this.removeItem(productId);
      } else {
        this.save();
      }
    }
  }

  getTotal() {
    return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  getCount() {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  save() {
    try {
      sessionStorage.setItem('cart', JSON.stringify(this.items));
    } catch (error) {
      console.error('Failed to save cart:', error);
    }
    this.notify();
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    callback(this.items);
  }

  notify() {
    this.subscribers.forEach(callback => callback(this.items));
  }

  clear() {
    this.items = [];
    localStorage.setItem('cart', '[]'); // Explicitly set to empty array string
    this.notify();
  }
}