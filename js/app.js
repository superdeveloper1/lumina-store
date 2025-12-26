import { products } from './products.js';
import { Cart } from './cart.js';
import { CheckoutManager } from './checkout.js';

const cart = new Cart();
const checkoutManager = new CheckoutManager();
let currentCategory = 'All';
let searchQuery = '';

// DOM Elements
const productGrid = document.getElementById('product-grid');
const cartDrawer = document.getElementById('cart-drawer');
const cartOverlay = document.getElementById('cart-overlay');
const cartItemsContainer = document.getElementById('cart-items');
const cartCountBadge = document.getElementById('cart-count');
const cartTotalElement = document.getElementById('cart-total');
const categoryFilters = document.getElementById('category-filters');
const searchInput = document.getElementById('search-input');
const searchDropdown = document.getElementById('search-dropdown');
const accountBtn = document.getElementById('account-btn');
const accountModal = document.getElementById('account-modal');
const accountOverlay = document.getElementById('account-overlay');
const accountContent = document.getElementById('account-content');
const accountLabel = document.getElementById('account-label');
const toastNotification = document.getElementById('toast-notification');
const toastMessage = document.getElementById('toast-message');
const closeToast = document.getElementById('close-toast');
const backToTopBtn = document.getElementById('back-to-top');
const viewMobileBtn = document.getElementById('view-mobile');
const viewTabletBtn = document.getElementById('view-tablet');
const viewLaptopBtn = document.getElementById('view-laptop');
const viewportFrame = document.getElementById('viewport-frame');
const viewportContainer = document.getElementById('viewport-container');
const viewportIframe = document.getElementById('viewport-iframe');
const viewportLabel = document.getElementById('viewport-label');
const viewportDimensions = document.getElementById('viewport-dimensions');
const closeViewport = document.getElementById('close-viewport');
const viewportBackToTopBtn = document.getElementById('viewport-back-to-top');

let currentUser = null;
let toastTimeout = null;
let isCheckoutPending = false;
const checkoutMessageElement = document.getElementById('checkout-message'); // New: Checkout message element

// Checkout Container (created dynamically)
const checkoutContainer = document.createElement('div');
checkoutContainer.id = 'checkout-view';
checkoutContainer.className = 'hidden max-w-2xl mx-auto py-8 px-4';
productGrid.parentElement.insertBefore(checkoutContainer, productGrid);

// Initialize Lucide Icons - now accepts an optional container
function initIcons(container = document) {
  if (typeof lucide !== 'undefined') {
    // Only create icons within the specified container
    lucide.createIcons({ root: container });
  } else {
    // Retry a few times in case of slow loading
    const checkLucide = setInterval(() => {
      if (typeof lucide !== 'undefined') {
        lucide.createIcons({ root: container });
        clearInterval(checkLucide);
      }
    }, 100);
    // Stop checking after 3 seconds
    setTimeout(() => clearInterval(checkLucide), 3000);
  }
}

// Render Products
function renderProducts() {
  const filtered = products.filter(p => {
    const matchesCategory = currentCategory === 'All' || p.category === currentCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  productGrid.innerHTML = filtered.map(product => `
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
      <div class="relative overflow-hidden aspect-video">
        <img src="${product.image}" alt="${product.name}" onerror="this.onerror=null;this.src='https://via.placeholder.com/600x400/f3f4f6/1f2937?text=${encodeURIComponent(product.name)}'" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
        <div class="absolute top-2 right-2">
          <span class="bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-semibold text-gray-700 shadow-sm">${product.category}</span>
        </div>
      </div>
      <div class="p-5">
        <h3 class="text-lg font-bold text-gray-900 mb-1">${product.name}</h3>
        <p class="text-gray-500 text-sm mb-4 line-clamp-2">${product.description}</p>
        <div class="flex items-center justify-between">
          <span class="text-xl font-bold text-indigo-600">$${product.price.toFixed(2)}</span>
          <button 
            data-id="${product.id}"
            class="add-to-cart bg-gray-900 text-white p-2 rounded-lg hover:bg-indigo-600 transition-colors flex items-center gap-2 px-4 py-2"
          >
            <i data-lucide="shopping-cart" class="w-4 h-4"></i>
            Add
          </button>
        </div>
      </div>
    </div>
  `).join('');
  
  initIcons(productGrid); // Only process icons within the product grid
}

// Render Cart
function renderCart(items) {
  cartCountBadge.textContent = cart.getCount();
  cartTotalElement.textContent = `$${cart.getTotal().toFixed(2)}`;

  if (items.length === 0) {
    cartItemsContainer.innerHTML = `
      <div class="flex flex-col items-center justify-center h-64 text-gray-400">
        <i data-lucide="shopping-bag" class="w-12 h-12 mb-4 opacity-20"></i>
        <p>Your cart is empty</p>
      </div>
    `;
  } else {
    cartItemsContainer.innerHTML = items.map(item => `
      <div class="flex items-center gap-4 py-4 border-b border-gray-100">
        <img src="${item.image}" alt="${item.name}" onerror="this.onerror=null;this.src='https://via.placeholder.com/100x100/f3f4f6/1f2937?text=${encodeURIComponent(item.name)}'" class="w-16 h-16 rounded-lg object-cover">
        <div class="flex-1">
          <h4 class="text-sm font-semibold text-gray-900">${item.name}</h4>
          <p class="text-xs text-gray-500">$${item.price.toFixed(2)}</p>
          <div class="flex items-center gap-3 mt-2">
            <button class="qty-btn" data-id="${item.id}" data-action="dec">
              <i data-lucide="minus-circle" class="w-4 h-4 text-gray-400 hover:text-indigo-600"></i>
            </button>
            <span class="text-sm font-medium w-4 text-center">${item.quantity}</span>
            <button class="qty-btn" data-id="${item.id}" data-action="inc">
              <i data-lucide="plus-circle" class="w-4 h-4 text-gray-400 hover:text-indigo-600"></i>
            </button>
          </div>
        </div>
        <button class="remove-btn text-gray-300 hover:text-red-500" data-id="${item.id}">
          <i data-lucide="trash-2" class="w-4 h-4"></i>
        </button>
      </div>
    `).join('');
  }
  
  initIcons(cartItemsContainer); // Only process icons within the cart items container
}

// Toggle Cart
function toggleCart(show) {
  if (show) {
    cartDrawer.classList.remove('translate-x-full');
    cartOverlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  } else {
    cartDrawer.classList.add('translate-x-full');
    cartOverlay.classList.add('hidden');
    document.body.style.overflow = 'auto';
  }
}

// Show Toast Notification
function showToast(productName) {
  toastMessage.textContent = productName;
  toastNotification.classList.remove('translate-x-full');
  toastNotification.classList.remove('opacity-0');
  
  if (toastTimeout) clearTimeout(toastTimeout);
  
  toastTimeout = setTimeout(() => {
    hideToast();
  }, 3000);
  
  initIcons(toastNotification);
}

function hideToast() {
  toastNotification.classList.add('translate-x-full');
  toastNotification.classList.add('opacity-0');
  if (toastTimeout) clearTimeout(toastTimeout);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  // Check if running inside iframe - if so, don't show view switcher
  const isInIframe = window.self !== window.top;
  
  if (isInIframe) {
    // Hide view switcher when inside iframe
    const viewSwitcher = document.getElementById('view-switcher');
    if (viewSwitcher) {
      viewSwitcher.remove();
    }
    
    // Force hide with CSS as backup
    const style = document.createElement('style');
    style.textContent = '#view-switcher { display: none !important; }';
    document.head.appendChild(style);

    // Hide internal back-to-top button in iframe to avoid duplication
    const internalBackToTop = document.getElementById('back-to-top');
    if (internalBackToTop) internalBackToTop.style.display = 'none';
  }
  
  renderProducts();
  cart.subscribe(renderCart);
  initIcons();
  loadUser();

  // Initialize view switcher buttons (only if not in iframe)
  if (!isInIframe && viewMobileBtn && viewTabletBtn && viewLaptopBtn) {
    viewMobileBtn.addEventListener('click', () => switchView('mobile'));
    viewTabletBtn.addEventListener('click', () => switchView('tablet'));
    viewLaptopBtn.addEventListener('click', () => switchView('laptop'));
  }
  
  if (closeViewport) {
    closeViewport.addEventListener('click', closeViewportFrame);
  }


  // Event delegation for Add to Cart buttons on product grid
  productGrid.addEventListener('click', (e) => {
    const addToCartBtn = e.target.closest('.add-to-cart');
    if (addToCartBtn) {
      const id = parseInt(addToCartBtn.dataset.id);
      const product = products.find(p => p.id === id);
      if (product) {
        cart.addItem(product);
        showToast(product.name);
      }
    }
  });

  // Event delegation for quantity and remove buttons in the cart
  cartItemsContainer.addEventListener('click', (e) => {
    const qtyBtn = e.target.closest('.qty-btn');
    const removeBtn = e.target.closest('.remove-btn');

    if (qtyBtn) {
      const id = parseInt(qtyBtn.dataset.id);
      const action = qtyBtn.dataset.action;
      const item = cart.items.find(i => i.id === id);
      if (item) {
        if (action === 'inc') cart.updateQuantity(id, item.quantity + 1);
        else cart.updateQuantity(id, item.quantity - 1);
      }
    } else if (removeBtn) {
      const id = parseInt(removeBtn.dataset.id);
      cart.removeItem(id);
    }
  });

  // UI Event Listeners
  document.getElementById('cart-toggle').addEventListener('click', () => toggleCart(true));
  document.getElementById('close-cart').addEventListener('click', () => toggleCart(false));
  cartOverlay.addEventListener('click', () => toggleCart(false));

  // Search with dropdown
  if (searchInput && searchDropdown) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderProducts();
      updateSearchDropdown();
    });

    searchInput.addEventListener('focus', () => {
      if (searchQuery) {
        updateSearchDropdown();
      }
    });

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const filtered = products.filter(p => {
          const matchesCategory = currentCategory === 'All' || p.category === currentCategory;
          const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
          return matchesCategory && matchesSearch;
        });
        
        if (filtered.length > 0) {
          searchDropdown.classList.add('hidden');
          const firstProduct = filtered[0];
          const productElement = document.querySelector(`[data-id="${firstProduct.id}"]`);
          if (productElement) {
            productElement.closest('.bg-white').scrollIntoView({ behavior: 'smooth', block: 'center' });
            productElement.closest('.bg-white').classList.add('ring-2', 'ring-indigo-500');
            setTimeout(() => {
              productElement.closest('.bg-white').classList.remove('ring-2', 'ring-indigo-500');
            }, 2000);
          }
        }
      }
    });

    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
        searchDropdown.classList.add('hidden');
      }
    });
  }

  function updateSearchDropdown() {
    if (!searchQuery) {
      searchDropdown.classList.add('hidden');
      return;
    }

    const filtered = products.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (filtered.length === 0) {
      searchDropdown.innerHTML = '<div class="p-4 text-center text-gray-500 text-sm">No products found</div>';
      searchDropdown.classList.remove('hidden');
      return;
    }

    searchDropdown.innerHTML = filtered.slice(0, 8).map(product => `
      <div class="search-result-item p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 flex items-center gap-3" data-product-id="${product.id}">
        <img src="${product.image}" alt="${product.name}" class="w-12 h-12 object-cover rounded-lg">
        <div class="flex-1 min-w-0">
          <div class="font-medium text-sm text-gray-900 truncate">${product.name}</div>
          <div class="text-xs text-gray-500">${product.category} • $${product.price.toFixed(2)}</div>
        </div>
      </div>
    `).join('');

    searchDropdown.classList.remove('hidden');

    document.querySelectorAll('.search-result-item').forEach(item => {
      item.addEventListener('click', () => {
        const productId = parseInt(item.dataset.productId);
        searchDropdown.classList.add('hidden');
        searchInput.value = '';
        searchQuery = '';
        renderProducts();
        
        setTimeout(() => {
          const productElement = document.querySelector(`[data-id="${productId}"]`);
          if (productElement) {
            productElement.closest('.bg-white').scrollIntoView({ behavior: 'smooth', block: 'center' });
            productElement.closest('.bg-white').classList.add('ring-2', 'ring-indigo-500');
            setTimeout(() => {
              productElement.closest('.bg-white').classList.remove('ring-2', 'ring-indigo-500');
            }, 2000);
          }
        }, 100);
      });
    });
  }

  // Filter Categories
  const categories = ['All', ...new Set(products.map(p => p.category))];
  categoryFilters.innerHTML = categories.map(cat => `
    <button class="filter-btn px-4 py-2 rounded-full text-sm font-medium transition-all ${cat === currentCategory ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}" data-category="${cat}">
      ${cat}
    </button>
  `).join('');

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentCategory = btn.dataset.category;
      document.querySelectorAll('.filter-btn').forEach(b => {
        b.classList.toggle('bg-indigo-600', b.dataset.category === currentCategory);
        b.classList.toggle('text-white', b.dataset.category === currentCategory);
        b.classList.toggle('bg-gray-100', b.dataset.category !== currentCategory);
        b.classList.toggle('text-gray-600', b.dataset.category !== currentCategory);
      });
      renderProducts();
    });
  });

  // Checkout Simulation
  document.getElementById('checkout-btn').addEventListener('click', () => {
    if (cart.items.length === 0) {
      alert('Your cart is empty!');
      return;
    }
    
    if (!currentUser) {
      isCheckoutPending = true;
      alert('Please log in or sign up to proceed with checkout.');
      toggleCart(false);
      openAccountModal();
      return;
    }
    toggleCart(false);
    startCheckout();
  });

  function startCheckout() {
    // Hide Shop Views
    productGrid.classList.add('hidden');
    categoryFilters.classList.add('hidden');
    checkoutContainer.classList.remove('hidden');
    
    // Scroll to checkout section
    checkoutContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    renderPaymentStep();
  }

  function renderPaymentStep() {
    checkoutContainer.innerHTML = `
      <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 class="text-2xl font-bold mb-6">Step 1: Select Payment Method</h2>
        <div class="space-y-3">
          ${['credit_card', 'paypal', 'bank_transfer'].map(method => `
            <button class="w-full text-left p-4 border rounded-lg hover:border-indigo-600 hover:bg-indigo-50 transition-colors payment-select-btn" data-method="${method}">
              <span class="font-semibold capitalize">${method.replace('_', ' ')}</span>
            </button>
          `).join('')}
        </div>
        <button id="cancel-checkout" class="mt-6 text-gray-500 hover:text-gray-800">Cancel</button>
      </div>
    `;

    checkoutContainer.querySelectorAll('.payment-select-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        checkoutManager.selectPaymentMethod(btn.dataset.method);
        renderPlaceOrderStep();
      });
    });

    document.getElementById('cancel-checkout').addEventListener('click', endCheckout);
  }

  function renderPlaceOrderStep() {
    const total = cart.getTotal().toFixed(2);
    checkoutContainer.innerHTML = `
      <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 class="text-2xl font-bold mb-6">Step 2: Place Order</h2>
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
          <input type="email" id="checkout-email" class="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none" placeholder="name@example.com">
        </div>
        <div class="border-t pt-4 mb-6">
          <div class="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>$${total}</span>
          </div>
          <p class="text-sm text-gray-500 mt-1">Payment: ${checkoutManager.selectedPaymentMethod.replace('_', ' ')}</p>
        </div>
        <button id="confirm-order" class="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition-colors">
          Place Order ($${total})
        </button>
        <button id="back-to-payment" class="mt-4 text-gray-500 hover:text-gray-800 w-full text-center">Back</button>
      </div>
    `;

    document.getElementById('back-to-payment').addEventListener('click', renderPaymentStep);
    
    document.getElementById('confirm-order').addEventListener('click', async () => {
      const email = document.getElementById('checkout-email').value;
      if (!email) {
        alert('Please enter your email.');
        return;
      }
      
      // Show loading
      checkoutContainer.innerHTML = `
        <div class="flex flex-col items-center justify-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <p id="checkout-status" class="text-gray-600">Starting order...</p>
        </div>
      `;

      try {
        const { emailContent } = await checkoutManager.placeOrder(cart.items, email, (status) => {
          const statusEl = document.getElementById('checkout-status');
          if (statusEl) statusEl.textContent = status;
        });

        cart.clear();

        renderEmailStep(emailContent);
      } catch (error) {
        alert(error.message);
        renderPlaceOrderStep();
      }
    });
  }

  function renderEmailStep(emailContent) {
    checkoutContainer.innerHTML = `
      <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 class="text-2xl font-bold mb-2 text-green-600">Step 3: Success!</h2>
        <p class="text-gray-600 mb-6">Your order has been placed. Below is a preview of the email sent to you:</p>
        
        <div class="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-6">
          ${emailContent}
        </div>

        <button id="finish-checkout" class="w-full bg-gray-900 text-white py-3 rounded-lg font-bold hover:bg-gray-800 transition-colors">
          Continue Shopping
        </button>
      </div>
    `;
    
    document.getElementById('finish-checkout').addEventListener('click', endCheckout);
  }

  function endCheckout() {
    checkoutContainer.classList.add('hidden');
    productGrid.classList.remove('hidden');
    categoryFilters.classList.remove('hidden');
  }

  // Account functionality
  function loadUser() {
    const stored = sessionStorage.getItem('currentUser');
    if (stored) {
      currentUser = JSON.parse(stored);
      accountLabel.textContent = currentUser.name.split(' ')[0];
    }
  }

  function saveUser(user) {
    if (!user.joinDate) {
      user.joinDate = Date.now();
    }
    currentUser = user;
    sessionStorage.setItem('currentUser', JSON.stringify(user));
    accountLabel.textContent = user.name.split(' ')[0];
  }

  function logout() {
    currentUser = null;
    sessionStorage.removeItem('currentUser');
    sessionStorage.removeItem('cart');
    accountLabel.textContent = 'Account';
    cart.clear();
    closeAccountModal();
    window.location.reload();
  }

  function openAccountModal() {
    accountModal.classList.remove('hidden');
    accountOverlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    
    if (currentUser) {
      renderProfileView();
    } else {
      renderLoginView();
    }
  }

  function closeAccountModal() {
    accountModal.classList.add('hidden');
    accountOverlay.classList.add('hidden');
    document.body.style.overflow = 'auto';
    isCheckoutPending = false;
  }

  function renderLoginView() {
    accountContent.innerHTML = `
      <div class="p-8">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold text-gray-900">Welcome Back</h2>
          <button id="close-account-modal" class="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <i data-lucide="x" class="w-5 h-5 text-gray-400"></i>
          </button>
        </div>
        
        <form id="login-form" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" id="login-email" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" placeholder="you@example.com">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" id="login-password" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" placeholder="••••••••">
          </div>
          <button type="submit" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-bold transition-colors">
            Sign In
          </button>
        </form>
        
        <div class="mt-6 text-center">
          <p class="text-sm text-gray-600">Don't have an account? <button id="show-signup" class="text-indigo-600 hover:text-indigo-700 font-semibold">Sign Up</button></p>
        </div>
      </div>
    `;
    
    initIcons(accountContent);
    
    document.getElementById('close-account-modal').addEventListener('click', closeAccountModal);
    document.getElementById('login-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      
      const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
      const user = storedUsers.find(u => u.email === email && u.password === password);
      
      if (user) {
        saveUser({ name: user.name, email: user.email, joinDate: user.joinDate });
        if (isCheckoutPending) {
          closeAccountModal();
          startCheckout();
        } else {
          renderProfileView();
        }
      } else {
        alert('Invalid email or password');
      }
    });
    
    document.getElementById('show-signup').addEventListener('click', renderSignupView);
  }

  function renderSignupView() {
    accountContent.innerHTML = `
      <div class="p-8">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold text-gray-900">Create Account</h2>
          <button id="close-account-modal" class="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <i data-lucide="x" class="w-5 h-5 text-gray-400"></i>
          </button>
        </div>
        
        <form id="signup-form" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input type="text" id="signup-name" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" placeholder="John Doe">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" id="signup-email" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" placeholder="you@example.com">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" id="signup-password" required minlength="6" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" placeholder="••••••••">
          </div>
          <button type="submit" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-bold transition-colors">
            Create Account
          </button>
        </form>
        
        <div class="mt-6 text-center">
          <p class="text-sm text-gray-600">Already have an account? <button id="show-login" class="text-indigo-600 hover:text-indigo-700 font-semibold">Sign In</button></p>
        </div>
      </div>
    `;
    
    initIcons(accountContent);
    
    document.getElementById('close-account-modal').addEventListener('click', closeAccountModal);
    document.getElementById('signup-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('signup-name').value;
      const email = document.getElementById('signup-email').value;
      const password = document.getElementById('signup-password').value;
      
      const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
      
      if (storedUsers.find(u => u.email === email)) {
        alert('Email already registered');
        return;
      }
      
      storedUsers.push({ name, email, password, joinDate: Date.now() });
      localStorage.setItem('users', JSON.stringify(storedUsers));
      
      saveUser({ name, email, joinDate: Date.now() });
      if (isCheckoutPending) {
        closeAccountModal();
        startCheckout();
      } else {
        renderProfileView();
      }
    });
    
    document.getElementById('show-login').addEventListener('click', renderLoginView);
  }

  function renderProfileView() {
    const orderHistory = JSON.parse(localStorage.getItem('orderHistory') || '[]');
    const userOrders = orderHistory.filter(order => order.email === currentUser.email);
    const totalSpent = userOrders.reduce((sum, order) => sum + order.total, 0);
    
    accountContent.innerHTML = `
      <div class="p-8 max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold text-gray-900">My Account</h2>
          <button id="close-account-modal" class="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <i data-lucide="x" class="w-5 h-5 text-gray-400"></i>
          </button>
        </div>
        
        <div class="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 mb-6 text-white">
          <div class="flex items-center gap-4 mb-4">
            <div class="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-2xl font-bold">
              ${currentUser.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 class="text-xl font-bold">${currentUser.name}</h3>
              <p class="text-indigo-100 text-sm">${currentUser.email}</p>
              <p class="text-indigo-200 text-xs mt-1">Member since ${new Date(currentUser.joinDate || Date.now()).toLocaleDateString()}</p>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/20">
            <div>
              <p class="text-indigo-200 text-xs">Total Orders</p>
              <p class="text-2xl font-bold">${userOrders.length}</p>
            </div>
            <div>
              <p class="text-indigo-200 text-xs">Total Spent</p>
              <p class="text-2xl font-bold">$${totalSpent.toFixed(2)}</p>
            </div>
          </div>
        </div>
        
        <div class="mb-6">
          <h3 class="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <i data-lucide="package" class="w-5 h-5"></i>
            Recent Orders
          </h3>
          ${userOrders.length > 0 ? `
            <div class="space-y-3 max-h-64 overflow-y-auto">
              ${userOrders.slice(0, 5).reverse().map(order => `
                <div class="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors">
                  <div class="flex justify-between items-start mb-2">
                    <div>
                      <p class="font-semibold text-sm text-gray-900">${order.orderId}</p>
                      <p class="text-xs text-gray-500">${new Date(order.date).toLocaleDateString()} at ${new Date(order.date).toLocaleTimeString()}</p>
                    </div>
                    <span class="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">Completed</span>
                  </div>
                  <div class="text-sm text-gray-600 mb-2">
                    ${order.items.length} item${order.items.length > 1 ? 's' : ''} • ${order.paymentMethod.replace('_', ' ')}
                  </div>
                  <div class="flex justify-between items-center">
                    <p class="font-bold text-indigo-600">$${order.total.toFixed(2)}</p>
                    <button class="view-order-btn text-xs text-indigo-600 hover:text-indigo-700 font-medium" data-order='${JSON.stringify(order).replace(/'/g, "&apos;")}'>View Details</button>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : `
            <div class="text-center py-8 bg-gray-50 rounded-lg">
              <i data-lucide="shopping-bag" class="w-12 h-12 text-gray-300 mx-auto mb-2"></i>
              <p class="text-gray-500 text-sm">No orders yet</p>
              <button id="start-shopping" class="mt-3 text-indigo-600 hover:text-indigo-700 font-medium text-sm">Start Shopping</button>
            </div>
          `}
        </div>
        
        <div class="space-y-2 mb-6">
          <h3 class="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <i data-lucide="user" class="w-5 h-5"></i>
            Account Settings
          </h3>
          <button id="edit-profile-btn" class="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left">
            <div class="flex items-center gap-3">
              <i data-lucide="edit" class="w-5 h-5 text-gray-600"></i>
              <span class="font-medium text-gray-900">Edit Profile</span>
            </div>
            <i data-lucide="chevron-right" class="w-5 h-5 text-gray-400"></i>
          </button>
          <button id="change-password-btn" class="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left">
            <div class="flex items-center gap-3">
              <i data-lucide="lock" class="w-5 h-5 text-gray-600"></i>
              <span class="font-medium text-gray-900">Change Password</span>
            </div>
            <i data-lucide="chevron-right" class="w-5 h-5 text-gray-400"></i>
          </button>
          <button id="shipping-addresses-btn" class="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left">
            <div class="flex items-center gap-3">
              <i data-lucide="map-pin" class="w-5 h-5 text-gray-600"></i>
              <span class="font-medium text-gray-900">Shipping Addresses</span>
            </div>
            <i data-lucide="chevron-right" class="w-5 h-5 text-gray-400"></i>
          </button>
          <button id="payment-methods-btn" class="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left">
            <div class="flex items-center gap-3">
              <i data-lucide="credit-card" class="w-5 h-5 text-gray-600"></i>
              <span class="font-medium text-gray-900">Payment Methods</span>
            </div>
            <i data-lucide="chevron-right" class="w-5 h-5 text-gray-400"></i>
          </button>
          <button id="notifications-btn" class="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left">
            <div class="flex items-center gap-3">
              <i data-lucide="bell" class="w-5 h-5 text-gray-600"></i>
              <span class="font-medium text-gray-900">Notifications</span>
            </div>
            <i data-lucide="chevron-right" class="w-5 h-5 text-gray-400"></i>
          </button>
        </div>
        
        <button id="logout-btn" class="w-full flex items-center justify-center gap-2 p-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-medium transition-colors">
          <i data-lucide="log-out" class="w-5 h-5"></i>
          Sign Out
        </button>
      </div>
    `;
    
    initIcons(accountContent);
    
    document.getElementById('close-account-modal').addEventListener('click', closeAccountModal);
    document.getElementById('logout-btn').addEventListener('click', logout);
    
    const startShoppingBtn = document.getElementById('start-shopping');
    if (startShoppingBtn) {
      startShoppingBtn.addEventListener('click', closeAccountModal);
    }
    
    document.querySelectorAll('.view-order-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const order = JSON.parse(btn.dataset.order);
        renderOrderDetailsView(order);
      });
    });
    
    document.getElementById('edit-profile-btn').addEventListener('click', renderEditProfileView);
    document.getElementById('change-password-btn').addEventListener('click', renderChangePasswordView);
    document.getElementById('shipping-addresses-btn').addEventListener('click', renderShippingAddressesView);
    document.getElementById('payment-methods-btn').addEventListener('click', renderPaymentMethodsView);
    document.getElementById('notifications-btn').addEventListener('click', renderNotificationsView);
  }

  function renderEditProfileView() {
    accountContent.innerHTML = `
      <div class="p-8">
        <div class="flex items-center gap-3 mb-6">
          <button id="back-to-profile" class="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <i data-lucide="arrow-left" class="w-5 h-5 text-gray-600"></i>
          </button>
          <h2 class="text-2xl font-bold text-gray-900">Edit Profile</h2>
        </div>
        
        <form id="edit-profile-form" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input type="text" id="edit-name" value="${currentUser.name}" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" id="edit-email" value="${currentUser.email}" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Phone Number (Optional)</label>
            <input type="tel" id="edit-phone" value="${currentUser.phone || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" placeholder="+1 (555) 000-0000">
          </div>
          <button type="submit" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-bold transition-colors">
            Save Changes
          </button>
        </form>
      </div>
    `;
    
    initIcons(accountContent);
    
    document.getElementById('back-to-profile').addEventListener('click', renderProfileView);
    document.getElementById('edit-profile-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('edit-name').value;
      const email = document.getElementById('edit-email').value;
      const phone = document.getElementById('edit-phone').value;
      
      currentUser.name = name;
      currentUser.email = email;
      currentUser.phone = phone;
      
      sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
      accountLabel.textContent = name.split(' ')[0];
      
      renderProfileView();
    });
  }

  function renderChangePasswordView() {
    accountContent.innerHTML = `
      <div class="p-8">
        <div class="flex items-center gap-3 mb-6">
          <button id="back-to-profile" class="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <i data-lucide="arrow-left" class="w-5 h-5 text-gray-600"></i>
          </button>
          <h2 class="text-2xl font-bold text-gray-900">Change Password</h2>
        </div>
        
        <form id="change-password-form" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <input type="password" id="current-password" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input type="password" id="new-password" required minlength="6" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <input type="password" id="confirm-password" required minlength="6" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none">
          </div>
          <button type="submit" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-bold transition-colors">
            Update Password
          </button>
        </form>
      </div>
    `;
    
    initIcons(accountContent);
    
    document.getElementById('back-to-profile').addEventListener('click', renderProfileView);
    document.getElementById('change-password-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const current = document.getElementById('current-password').value;
      const newPass = document.getElementById('new-password').value;
      const confirm = document.getElementById('confirm-password').value;
      
      if (newPass !== confirm) {
        alert('New passwords do not match');
        return;
      }
      
      const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
      const userIndex = storedUsers.findIndex(u => u.email === currentUser.email);
      
      if (userIndex === -1 || storedUsers[userIndex].password !== current) {
        alert('Current password is incorrect');
        return;
      }
      
      storedUsers[userIndex].password = newPass;
      localStorage.setItem('users', JSON.stringify(storedUsers));
      
      alert('Password updated successfully!');
      renderProfileView();
    });
  }

  function renderOrderDetailsView(order) {
    accountContent.innerHTML = `
      <div class="p-8 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center gap-3 mb-6">
          <button id="back-to-profile" class="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <i data-lucide="arrow-left" class="w-5 h-5 text-gray-600"></i>
          </button>
          <h2 class="text-2xl font-bold text-gray-900">Order Details</h2>
        </div>

        <div class="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
          <div class="flex justify-between items-start mb-3">
            <div>
              <p class="text-sm text-gray-600">Order ID</p>
              <p class="font-bold text-gray-900">${order.orderId}</p>
            </div>
            <span class="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">Completed</span>
          </div>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p class="text-gray-600">Date</p>
              <p class="font-medium">${new Date(order.date).toLocaleDateString()}</p>
            </div>
            <div>
              <p class="text-gray-600">Payment</p>
              <p class="font-medium capitalize">${order.paymentMethod.replace('_', ' ')}</p>
            </div>
          </div>
        </div>

        <h3 class="font-bold text-gray-900 mb-3">Items</h3>
        <div class="space-y-3 mb-6">
          ${order.items.map(item => `
            <div class="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div class="flex-1">
                <p class="font-medium text-gray-900">${item.name}</p>
                <p class="text-sm text-gray-600">Qty: ${item.quantity} × $${item.price.toFixed(2)}</p>
              </div>
              <p class="font-bold text-gray-900">$${item.total.toFixed(2)}</p>
            </div>
          `).join('')}
        </div>

        <div class="border-t pt-4">
          <div class="flex justify-between items-center text-lg font-bold">
            <span>Total</span>
            <span class="text-indigo-600">$${order.total.toFixed(2)}</span>
          </div>
        </div>

        <button id="reorder-btn" class="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-bold transition-colors">
          Reorder Items
        </button>
      </div>
    `;

    initIcons(accountContent);
    document.getElementById('back-to-profile').addEventListener('click', renderProfileView);
    document.getElementById('reorder-btn').addEventListener('click', () => {
      order.items.forEach(item => {
        const product = products.find(p => p.name === item.name);
        if (product) {
          for (let i = 0; i < item.quantity; i++) {
            cart.addItem(product);
          }
        }
      });
      closeAccountModal();
      toggleCart(true);
    });
  }

  function renderShippingAddressesView() {
    const addresses = JSON.parse(localStorage.getItem('shippingAddresses') || '[]').filter(a => a.userId === currentUser.email);
    
    accountContent.innerHTML = `
      <div class="p-8 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center gap-3 mb-6">
          <button id="back-to-profile" class="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <i data-lucide="arrow-left" class="w-5 h-5 text-gray-600"></i>
          </button>
          <h2 class="text-2xl font-bold text-gray-900">Shipping Addresses</h2>
        </div>

        <button id="add-address-btn" class="w-full mb-4 flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 hover:border-indigo-500 hover:bg-indigo-50 rounded-lg text-indigo-600 font-medium transition-colors">
          <i data-lucide="plus" class="w-5 h-5"></i>
          Add New Address
        </button>

        <div class="space-y-3">
          ${addresses.length > 0 ? addresses.map((addr, index) => `
            <div class="border border-gray-200 rounded-lg p-4 ${addr.isDefault ? 'ring-2 ring-indigo-500' : ''}">
              <div class="flex justify-between items-start mb-2">
                <div>
                  <p class="font-semibold text-gray-900">${addr.name}</p>
                  ${addr.isDefault ? '<span class="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full mt-1 inline-block">Default</span>' : ''}
                </div>
                <button class="delete-address-btn text-red-500 hover:text-red-700" data-index="${index}">
                  <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
              </div>
              <p class="text-sm text-gray-600">${addr.street}</p>
              <p class="text-sm text-gray-600">${addr.city}, ${addr.state} ${addr.zip}</p>
              <p class="text-sm text-gray-600">${addr.country}</p>
              <p class="text-sm text-gray-600 mt-2">Phone: ${addr.phone}</p>
              ${!addr.isDefault ? `<button class="set-default-btn text-xs text-indigo-600 hover:text-indigo-700 font-medium mt-2" data-index="${index}">Set as Default</button>` : ''}
            </div>
          `).join('') : '<p class="text-center text-gray-500 py-8">No addresses saved</p>'}
        </div>
      </div>
    `;

    initIcons(accountContent);
    document.getElementById('back-to-profile').addEventListener('click', renderProfileView);
    document.getElementById('add-address-btn').addEventListener('click', renderAddAddressView);
    
    document.querySelectorAll('.delete-address-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.dataset.index);
        addresses.splice(index, 1);
        const allAddresses = JSON.parse(localStorage.getItem('shippingAddresses') || '[]');
        const filtered = allAddresses.filter(a => a.userId !== currentUser.email);
        localStorage.setItem('shippingAddresses', JSON.stringify([...filtered, ...addresses]));
        renderShippingAddressesView();
      });
    });

    document.querySelectorAll('.set-default-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.dataset.index);
        addresses.forEach((a, i) => a.isDefault = i === index);
        const allAddresses = JSON.parse(localStorage.getItem('shippingAddresses') || '[]');
        const filtered = allAddresses.filter(a => a.userId !== currentUser.email);
        localStorage.setItem('shippingAddresses', JSON.stringify([...filtered, ...addresses]));
        renderShippingAddressesView();
      });
    });
  }

  function renderAddAddressView() {
    accountContent.innerHTML = `
      <div class="p-8">
        <div class="flex items-center gap-3 mb-6">
          <button id="back-to-addresses" class="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <i data-lucide="arrow-left" class="w-5 h-5 text-gray-600"></i>
          </button>
          <h2 class="text-2xl font-bold text-gray-900">Add Shipping Address</h2>
        </div>

        <form id="add-address-form" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input type="text" id="addr-name" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input type="tel" id="addr-phone" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
            <input type="text" id="addr-street" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input type="text" id="addr-city" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">State</label>
              <input type="text" id="addr-state" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
              <input type="text" id="addr-zip" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <input type="text" id="addr-country" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value="United States">
            </div>
          </div>
          <div class="flex items-center gap-2">
            <input type="checkbox" id="addr-default" class="w-4 h-4 text-indigo-600 rounded">
            <label for="addr-default" class="text-sm text-gray-700">Set as default address</label>
          </div>
          <button type="submit" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-bold transition-colors">
            Save Address
          </button>
        </form>
      </div>
    `;

    initIcons(accountContent);
    document.getElementById('back-to-addresses').addEventListener('click', renderShippingAddressesView);
    document.getElementById('add-address-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const newAddress = {
        userId: currentUser.email,
        name: document.getElementById('addr-name').value,
        phone: document.getElementById('addr-phone').value,
        street: document.getElementById('addr-street').value,
        city: document.getElementById('addr-city').value,
        state: document.getElementById('addr-state').value,
        zip: document.getElementById('addr-zip').value,
        country: document.getElementById('addr-country').value,
        isDefault: document.getElementById('addr-default').checked
      };

      const addresses = JSON.parse(localStorage.getItem('shippingAddresses') || '[]');
      if (newAddress.isDefault) {
        addresses.forEach(a => { if (a.userId === currentUser.email) a.isDefault = false; });
      }
      addresses.push(newAddress);
      localStorage.setItem('shippingAddresses', JSON.stringify(addresses));
      renderShippingAddressesView();
    });
  }

  function renderPaymentMethodsView() {
    const paymentMethods = JSON.parse(localStorage.getItem('paymentMethods') || '[]').filter(p => p.userId === currentUser.email);
    
    accountContent.innerHTML = `
      <div class="p-8 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center gap-3 mb-6">
          <button id="back-to-profile" class="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <i data-lucide="arrow-left" class="w-5 h-5 text-gray-600"></i>
          </button>
          <h2 class="text-2xl font-bold text-gray-900">Payment Methods</h2>
        </div>

        <button id="add-payment-btn" class="w-full mb-4 flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 hover:border-indigo-500 hover:bg-indigo-50 rounded-lg text-indigo-600 font-medium transition-colors">
          <i data-lucide="plus" class="w-5 h-5"></i>
          Add Payment Method
        </button>

        <div class="space-y-3">
          ${paymentMethods.length > 0 ? paymentMethods.map((pm, index) => `
            <div class="border border-gray-200 rounded-lg p-4 ${pm.isDefault ? 'ring-2 ring-indigo-500' : ''}">
              <div class="flex justify-between items-start">
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <i data-lucide="credit-card" class="w-6 h-6 text-white"></i>
                  </div>
                  <div>
                    <p class="font-semibold text-gray-900">${pm.type} •••• ${pm.lastFour}</p>
                    <p class="text-sm text-gray-600">Expires ${pm.expiry}</p>
                    ${pm.isDefault ? '<span class="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full mt-1 inline-block">Default</span>' : ''}
                  </div>
                </div>
                <button class="delete-payment-btn text-red-500 hover:text-red-700" data-index="${index}">
                  <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
              </div>
              ${!pm.isDefault ? `<button class="set-default-payment-btn text-xs text-indigo-600 hover:text-indigo-700 font-medium mt-2" data-index="${index}">Set as Default</button>` : ''}
            </div>
          `).join('') : '<p class="text-center text-gray-500 py-8">No payment methods saved</p>'}
        </div>
      </div>
    `;

    initIcons(accountContent);
    document.getElementById('back-to-profile').addEventListener('click', renderProfileView);
    document.getElementById('add-payment-btn').addEventListener('click', renderAddPaymentView);

    document.querySelectorAll('.delete-payment-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.dataset.index);
        paymentMethods.splice(index, 1);
        const allPayments = JSON.parse(localStorage.getItem('paymentMethods') || '[]');
        const filtered = allPayments.filter(p => p.userId !== currentUser.email);
        localStorage.setItem('paymentMethods', JSON.stringify([...filtered, ...paymentMethods]));
        renderPaymentMethodsView();
      });
    });

    document.querySelectorAll('.set-default-payment-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.dataset.index);
        paymentMethods.forEach((p, i) => p.isDefault = i === index);
        const allPayments = JSON.parse(localStorage.getItem('paymentMethods') || '[]');
        const filtered = allPayments.filter(p => p.userId !== currentUser.email);
        localStorage.setItem('paymentMethods', JSON.stringify([...filtered, ...paymentMethods]));
        renderPaymentMethodsView();
      });
    });
  }

  function renderAddPaymentView() {
    accountContent.innerHTML = `
      <div class="p-8">
        <div class="flex items-center gap-3 mb-6">
          <button id="back-to-payments" class="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <i data-lucide="arrow-left" class="w-5 h-5 text-gray-600"></i>
          </button>
          <h2 class="text-2xl font-bold text-gray-900">Add Payment Method</h2>
        </div>

        <form id="add-payment-form" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
            <input type="text" id="card-number" required maxlength="19" placeholder="1234 5678 9012 3456" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Cardholder Name</label>
            <input type="text" id="card-name" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
              <input type="text" id="card-expiry" required placeholder="MM/YY" maxlength="5" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">CVV</label>
              <input type="text" id="card-cvv" required maxlength="3" placeholder="123" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
            </div>
          </div>
          <div class="flex items-center gap-2">
            <input type="checkbox" id="payment-default" class="w-4 h-4 text-indigo-600 rounded">
            <label for="payment-default" class="text-sm text-gray-700">Set as default payment method</label>
          </div>
          <button type="submit" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-bold transition-colors">
            Save Payment Method
          </button>
        </form>
      </div>
    `;

    initIcons(accountContent);
    document.getElementById('back-to-payments').addEventListener('click', renderPaymentMethodsView);
    document.getElementById('add-payment-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const cardNumber = document.getElementById('card-number').value.replace(/\s/g, '');
      const newPayment = {
        userId: currentUser.email,
        type: 'Card',
        lastFour: cardNumber.slice(-4),
        expiry: document.getElementById('card-expiry').value,
        cardholderName: document.getElementById('card-name').value,
        isDefault: document.getElementById('payment-default').checked
      };

      const payments = JSON.parse(localStorage.getItem('paymentMethods') || '[]');
      if (newPayment.isDefault) {
        payments.forEach(p => { if (p.userId === currentUser.email) p.isDefault = false; });
      }
      payments.push(newPayment);
      localStorage.setItem('paymentMethods', JSON.stringify(payments));
      renderPaymentMethodsView();
    });
  }

  function renderNotificationsView() {
    const notificationSettings = JSON.parse(localStorage.getItem('notificationSettings') || '{}');
    const userSettings = notificationSettings[currentUser.email] || {
      orderUpdates: true,
      promotions: true,
      newsletter: false,
      sms: false
    };

    accountContent.innerHTML = `
      <div class="p-8">
        <div class="flex items-center gap-3 mb-6">
          <button id="back-to-profile" class="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <i data-lucide="arrow-left" class="w-5 h-5 text-gray-600"></i>
          </button>
          <h2 class="text-2xl font-bold text-gray-900">Notification Settings</h2>
        </div>

        <div class="space-y-4">
          <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p class="font-medium text-gray-900">Order Updates</p>
              <p class="text-sm text-gray-600">Receive notifications about your orders</p>
            </div>
            <label class="relative inline-block w-12 h-6">
              <input type="checkbox" id="notif-orders" ${userSettings.orderUpdates ? 'checked' : ''} class="sr-only peer">
              <div class="w-12 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500 rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p class="font-medium text-gray-900">Promotions</p>
              <p class="text-sm text-gray-600">Get notified about sales and special offers</p>
            </div>
            <label class="relative inline-block w-12 h-6">
              <input type="checkbox" id="notif-promos" ${userSettings.promotions ? 'checked' : ''} class="sr-only peer">
              <div class="w-12 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500 rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p class="font-medium text-gray-900">Newsletter</p>
              <p class="text-sm text-gray-600">Weekly updates and product recommendations</p>
            </div>
            <label class="relative inline-block w-12 h-6">
              <input type="checkbox" id="notif-newsletter" ${userSettings.newsletter ? 'checked' : ''} class="sr-only peer">
              <div class="w-12 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500 rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p class="font-medium text-gray-900">SMS Notifications</p>
              <p class="text-sm text-gray-600">Receive text messages for important updates</p>
            </div>
            <label class="relative inline-block w-12 h-6">
              <input type="checkbox" id="notif-sms" ${userSettings.sms ? 'checked' : ''} class="sr-only peer">
              <div class="w-12 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500 rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
        </div>

        <button id="save-notifications" class="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-bold transition-colors">
          Save Preferences
        </button>
      </div>
    `;

    initIcons(accountContent);
    document.getElementById('back-to-profile').addEventListener('click', renderProfileView);
    document.getElementById('save-notifications').addEventListener('click', () => {
      const settings = {
        orderUpdates: document.getElementById('notif-orders').checked,
        promotions: document.getElementById('notif-promos').checked,
        newsletter: document.getElementById('notif-newsletter').checked,
        sms: document.getElementById('notif-sms').checked
      };

      const allSettings = JSON.parse(localStorage.getItem('notificationSettings') || '{}');
      allSettings[currentUser.email] = settings;
      localStorage.setItem('notificationSettings', JSON.stringify(allSettings));
      
      alert('Notification preferences saved!');
      renderProfileView();
    });
  }

  accountBtn.addEventListener('click', openAccountModal);
  accountOverlay.addEventListener('click', closeAccountModal);
  closeToast.addEventListener('click', hideToast);

  // Back to Top Logic
  if (backToTopBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 300) {
        backToTopBtn.classList.remove('opacity-0', 'invisible', 'translate-y-10');
      } else {
        backToTopBtn.classList.add('opacity-0', 'invisible', 'translate-y-10');
      }
    });
    backToTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  // Navbar Hide/Show on Scroll
  const navbar = document.getElementById('main-nav');
  let lastScrollY = window.scrollY;

  window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;
    
    if (currentScrollY > lastScrollY && currentScrollY > 80) {
      navbar.style.transform = 'translateY(-100%)';
    } else {
      navbar.style.transform = 'translateY(0)';
    }
    lastScrollY = currentScrollY;
  });

  // Viewport Back to Top Logic
  if (viewportFrame && viewportBackToTopBtn) {
    viewportFrame.addEventListener('scroll', () => {
      const iframeScroll = viewportIframe.contentWindow ? viewportIframe.contentWindow.scrollY : 0;
      if (viewportFrame.scrollTop > 200 || iframeScroll > 300) {
        viewportBackToTopBtn.classList.remove('opacity-0', 'invisible', 'translate-y-10');
      } else {
        viewportBackToTopBtn.classList.add('opacity-0', 'invisible', 'translate-y-10');
      }
    });
    viewportBackToTopBtn.addEventListener('click', () => {
      viewportFrame.scrollTo({ top: 0, behavior: 'smooth' });
      if (viewportIframe.contentWindow) {
        viewportIframe.contentWindow.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }
});

// View Switcher Functions
function switchView(viewType) {
  if (viewType === 'laptop') {
    closeViewportFrame();
    return;
  }

  const views = {
    mobile: { width: '375px', height: '667px', label: 'Mobile View', dimensions: '375×667' },
    tablet: { width: '768px', height: '1024px', label: 'Tablet View', dimensions: '768×1024' },
    laptop: { width: '100%', height: '100%', label: 'Laptop View', dimensions: 'Full Screen' }
  };

  const view = views[viewType];
  
  // If already in viewport, just update the size
  const isViewportOpen = !viewportFrame.classList.contains('hidden');
  
  if (viewportLabel) viewportLabel.textContent = view.label;
  if (viewportDimensions) viewportDimensions.textContent = view.dimensions;

  viewportContainer.style.width = view.width;
  viewportContainer.style.height = view.height;
  
  if (viewType !== 'laptop') {
    viewportContainer.style.maxHeight = view.height;
  } else {
    viewportContainer.style.maxHeight = '100%';
  }

  // Reset back to top button state
  if (viewportBackToTopBtn) {
    viewportBackToTopBtn.classList.add('opacity-0', 'invisible', 'translate-y-10');
  }

  // Update active button state for main nav buttons
  [viewMobileBtn, viewTabletBtn, viewLaptopBtn].forEach(btn => {
    if (btn) {
      btn.classList.remove('bg-white', 'shadow-sm');
      const icon = btn.querySelector('i');
      if (icon) {
        icon.classList.remove('text-indigo-600');
        icon.classList.add('text-gray-600');
      }
    }
  });

  // Set active state for main nav
  const activeBtn = viewType === 'mobile' ? viewMobileBtn : viewType === 'tablet' ? viewTabletBtn : viewLaptopBtn;
  if (activeBtn) {
    activeBtn.classList.add('bg-white', 'shadow-sm');
    const icon = activeBtn.querySelector('i');
    if (icon) {
      icon.classList.remove('text-gray-600');
      icon.classList.add('text-indigo-600');
    }
  }

  // Show viewport if not already shown
  if (!isViewportOpen) {
    viewportFrame.classList.remove('hidden');
    viewportIframe.src = window.location.href;
    document.body.style.overflow = 'hidden';

    // Handle iframe load to attach scroll listeners
    viewportIframe.onload = () => {
      const iframeWin = viewportIframe.contentWindow;
      if (iframeWin) {
        // Hide internal button
        const internalBtn = iframeWin.document.getElementById('back-to-top');
        if (internalBtn) internalBtn.style.display = 'none';

        // Attach scroll listener
        iframeWin.addEventListener('scroll', () => {
          const frameScroll = viewportFrame.scrollTop;
          const iframeScroll = iframeWin.scrollY;
          
          if (frameScroll > 200 || iframeScroll > 300) {
            viewportBackToTopBtn.classList.remove('opacity-0', 'invisible', 'translate-y-10');
          } else {
            viewportBackToTopBtn.classList.add('opacity-0', 'invisible', 'translate-y-10');
          }
        });
      }
    };
  }
  
  // Re-initialize icons after state changes
  setTimeout(() => {
    initIcons(viewportFrame);
  }, 100);
}

function closeViewportFrame() {
  viewportFrame.classList.add('hidden');
  viewportIframe.src = '';
  document.body.style.overflow = 'auto';
  
  // Reset main nav buttons
  [viewMobileBtn, viewTabletBtn, viewLaptopBtn].forEach(btn => {
    if (btn) {
      btn.classList.remove('bg-white', 'shadow-sm');
      const icon = btn.querySelector('i');
      if (icon) {
        icon.classList.remove('text-indigo-600');
        icon.classList.add('text-gray-600');
      }
    }
  });
  
  // Set laptop as default active
  if (viewLaptopBtn) {
    viewLaptopBtn.classList.add('bg-white', 'shadow-sm');
    const icon = viewLaptopBtn.querySelector('i');
    if (icon) {
      icon.classList.remove('text-gray-600');
      icon.classList.add('text-indigo-600');
    }
  }
}