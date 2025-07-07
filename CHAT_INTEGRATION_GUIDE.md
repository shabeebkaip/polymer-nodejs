# Chat with Supplier - Frontend Integration Guide

## 🚀 Overview
This guide shows how to implement the "Chat with Supplier" functionality in two ways:
1. **Product Detail Page Chat** - Direct chat from product pages (buyer-to-seller)
2. **Quote Request Chat** - Chat based on quote requests

## 📋 Product Detail Page Integration

### **Product-Based Chat Endpoints** (`/api/chat/product/`)

#### **Buyer Endpoints**

1. **Get Seller Info for Product**
   ```
   GET /api/chat/product/seller-info/:productId
   Headers: Authorization: Bearer <token>
   ```

2. **Get Chat Messages**
   ```
   GET /api/chat/product/messages/:productId?page=1&limit=50
   Headers: Authorization: Bearer <token>
   ```

3. **Send Message**
   ```
   POST /api/chat/product/send-message/:productId
   Headers: Authorization: Bearer <token>
   Body: { "message": "Hello, I'm interested in this product..." }
   ```

4. **Get All Product Conversations**
   ```
   GET /api/chat/product/conversations
   Headers: Authorization: Bearer <token>
   ```

#### **Seller Endpoints**

1. **Get All Product Conversations**
   ```
   GET /api/chat/seller-product/conversations
   Headers: Authorization: Bearer <token>
   ```

2. **Get Messages for Product-Buyer Pair**
   ```
   GET /api/chat/seller-product/messages/:productId/:buyerId?page=1&limit=50
   Headers: Authorization: Bearer <token>
   ```

3. **Send Message to Buyer**
   ```
   POST /api/chat/seller-product/send-message/:productId/:buyerId
   Headers: Authorization: Bearer <token>
   Body: { "message": "Thank you for your interest..." }
   ```

### **Frontend Implementation for Product Detail Page**

#### **1. Enhanced Product Detail API**

The product detail API now includes chat information:

```javascript
// Fetch product details with chat info
const response = await fetch(`/api/product/detail/${productId}`);
const productData = await response.json();

// Product now includes chat functionality
const product = productData.data;
const chatInfo = product.chatInfo;

// Check if chat is available
if (chatInfo.canChat) {
    showChatWithSupplierButton(chatInfo);
}
```

#### **2. Chat with Supplier Button for Product Page**

```html
<!-- Add to your product detail page -->
<button 
  id="chatWithSupplierBtn"
  onclick="openProductChat('{{ product._id }}')" 
  class="chat-supplier-btn">
  � Chat with Supplier
</button>
```

#### **3. JavaScript for Product Chat**

```javascript
// Function to open product chat
async function openProductChat(productId) {
  try {
    // Get seller info for this product
    const response = await fetch(`/api/chat/product/seller-info/${productId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    
    if (result.success) {
      const seller = result.data.seller;
      const product = result.data.product;
      
      // Open chat modal for product
      openProductChatModal(productId, seller, product);
    } else {
      alert('Unable to start chat: ' + result.message);
    }
  } catch (error) {
    console.error('Error opening product chat:', error);
    alert('Failed to open chat');
  }
}

// Function to open product chat modal
function openProductChatModal(productId, seller, product) {
  // Create chat modal for product
  const modal = document.createElement('div');
  modal.className = 'chat-modal';
  modal.innerHTML = `
    <div class="chat-modal-content">
      <div class="chat-header">
        <div class="chat-info">
          <h3>Chat about: ${product.productName}</h3>
          <p>Supplier: ${seller.name} (${seller.company})</p>
        </div>
        <button onclick="closeChatModal()" class="close-chat">×</button>
      </div>
      <div class="chat-messages" id="productChatMessages-${productId}"></div>
      <div class="chat-input-area">
        <input 
          type="text" 
          id="productMessageInput-${productId}" 
          placeholder="Type your message about this product..."
          onkeypress="handleProductChatKeyPress(event, '${productId}')"
        />
        <button onclick="sendProductMessage('${productId}')">Send</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Load existing messages for this product
  loadProductMessages(productId);
  
  // Join product chat room via Socket.IO
  if (socket) {
    socket.emit('joinProductChat', { 
      userId: getCurrentUserId(), 
      productId: productId 
    });
  }
}

// Function to send product message
async function sendProductMessage(productId) {
  const messageInput = document.getElementById(`productMessageInput-${productId}`);
  const message = messageInput.value.trim();
  
  if (!message) return;
  
  try {
    const response = await fetch(`/api/chat/product/send-message/${productId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message })
    });
    
    const result = await response.json();
    
    if (result.success) {
      messageInput.value = '';
      // Message will be added via Socket.IO event
    } else {
      alert('Failed to send message: ' + result.message);
    }
  } catch (error) {
    console.error('Error sending product message:', error);
    alert('Failed to send message');
  }
}

// Function to load product messages
async function loadProductMessages(productId) {
  try {
    const response = await fetch(`/api/chat/product/messages/${productId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    const result = await response.json();
    
    if (result.success) {
      displayProductMessages(productId, result.data.messages);
    }
  } catch (error) {
    console.error('Error loading product messages:', error);
  }
}

// Function to display product messages
function displayProductMessages(productId, messages) {
  const messagesContainer = document.getElementById(`productChatMessages-${productId}`);
  messagesContainer.innerHTML = '';
  
  messages.forEach(message => {
    addMessageToProductChat(productId, message);
  });
  
  // Scroll to bottom
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Function to add message to product chat
function addMessageToProductChat(productId, message) {
  const messagesContainer = document.getElementById(`productChatMessages-${productId}`);
  const messageEl = document.createElement('div');
  messageEl.className = `message ${message.senderId === getCurrentUserId() ? 'sent' : 'received'}`;
  
  messageEl.innerHTML = `
    <div class="message-content">
      <div class="message-text">${message.message}</div>
      <div class="message-time">${formatTime(message.createdAt)}</div>
      <div class="message-sender">${message.senderName}</div>
    </div>
  `;
  
  messagesContainer.appendChild(messageEl);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Handle Enter key for product chat
function handleProductChatKeyPress(event, productId) {
  if (event.key === 'Enter') {
    sendProductMessage(productId);
  }
}
```

---

## 📋 Quote Request Chat (Original)

### **Buyer Endpoints** (`/api/chat/buyer-seller/`)

1. **Get Seller Info for Quote**
   ```
   GET /api/chat/buyer-seller/seller-info/:quoteId
   Headers: Authorization: Bearer <token>
   ```

2. **Get Chat Messages**
   ```
   GET /api/chat/buyer-seller/messages/:quoteId?page=1&limit=50
   Headers: Authorization: Bearer <token>
   ```

3. **Send Message**
   ```
   POST /api/chat/buyer-seller/send-message/:quoteId
   Headers: Authorization: Bearer <token>
   Body: { "message": "Hello, I have a question about this quote..." }
   ```

4. **Get All Conversations**
   ```
   GET /api/chat/buyer-seller/conversations
   Headers: Authorization: Bearer <token>
   ```

### **Seller Endpoints** (`/api/chat/seller/`)

1. **Get All Conversations**
   ```
   GET /api/chat/seller/conversations
   Headers: Authorization: Bearer <token>
   ```

2. **Get Messages for Quote**
   ```
   GET /api/chat/seller/messages/:quoteId?page=1&limit=50
   Headers: Authorization: Bearer <token>
   ```

3. **Send Message**
   ```
   POST /api/chat/seller/send-message/:quoteId
   Headers: Authorization: Bearer <token>
   Body: { "message": "Thank you for your inquiry..." }
   ```

## 🔧 Frontend Implementation

### **1. Chat with Supplier Button**

Add this button to your quote request cards/details:

```html
<!-- In your quote request card/detail component -->
<button 
  onclick="openSupplierChat('{{ quote._id }}')" 
  class="chat-supplier-btn">
  💬 Chat with Supplier
</button>
```

### **2. JavaScript Functions**

```javascript
// Function to open chat popup
async function openSupplierChat(quoteId) {
  try {
    // First, get seller info for this quote
    const response = await fetch(`/api/chat/buyer-seller/seller-info/${quoteId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    
    if (result.success) {
      const seller = result.data.seller;
      const quote = result.data.quote;
      
      // Open chat modal/popup
      openChatModal(quoteId, seller, quote);
    } else {
      alert('Unable to start chat: ' + result.message);
    }
  } catch (error) {
    console.error('Error opening chat:', error);
    alert('Failed to open chat');
  }
}

// Function to open chat modal
function openChatModal(quoteId, seller, quote) {
  // Create or show chat modal
  const modal = document.getElementById('chatModal') || createChatModal();
  
  // Set seller info
  document.getElementById('sellerName').textContent = seller.name;
  document.getElementById('sellerCompany').textContent = seller.company;
  document.getElementById('productName').textContent = quote.requestType === 'product_quote' ? seller.productName : 'Deal Quote';
  
  // Store current chat context
  window.currentChat = { quoteId, sellerId: seller._id, seller, quote };
  
  // Load existing messages
  loadChatMessages(quoteId);
  
  // Show modal
  modal.style.display = 'block';
  
  // Join socket room for real-time updates
  if (window.socket) {
    window.socket.emit('joinQuoteChat', { 
      userId: getCurrentUserId(), 
      quoteId: quoteId 
    });
  }
}

// Function to load chat messages
async function loadChatMessages(quoteId, page = 1) {
  try {
    const response = await fetch(`/api/chat/buyer-seller/messages/${quoteId}?page=${page}&limit=50`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    
    if (result.success) {
      displayMessages(result.data.messages);
    }
  } catch (error) {
    console.error('Error loading messages:', error);
  }
}

// Function to send message
async function sendMessage() {
  const messageInput = document.getElementById('messageInput');
  const message = messageInput.value.trim();
  
  if (!message || !window.currentChat) return;
  
  try {
    const response = await fetch(`/api/chat/buyer-seller/send-message/${window.currentChat.quoteId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message })
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Clear input
      messageInput.value = '';
      
      // Add message to chat (it will also come via socket)
      addMessageToChat(result.data);
      
      // Send via socket for real-time delivery
      if (window.socket) {
        window.socket.emit('sendQuoteMessage', {
          senderId: getCurrentUserId(),
          receiverId: window.currentChat.sellerId,
          message: message,
          quoteId: window.currentChat.quoteId
        });
      }
    }
  } catch (error) {
    console.error('Error sending message:', error);
  }
}

// Function to display messages
function displayMessages(messages) {
  const chatMessages = document.getElementById('chatMessages');
  chatMessages.innerHTML = '';
  
  messages.forEach(msg => {
    addMessageToChat(msg);
  });
  
  // Scroll to bottom
  chatMessages.scrollTop = chatMessages.scrollTop;
}

// Function to add single message to chat
function addMessageToChat(message) {
  const chatMessages = document.getElementById('chatMessages');
  const messageDiv = document.createElement('div');
  
  messageDiv.className = `message ${message.isFromBuyer ? 'sent' : 'received'}`;
  messageDiv.innerHTML = `
    <div class="message-content">
      <div class="message-text">${message.message}</div>
      <div class="message-time">${formatTime(message.createdAt)}</div>
    </div>
    <div class="message-sender">${message.senderName}</div>
  `;
  
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}
```

### **3. HTML Modal Structure**

```html
<!-- Chat Modal -->
<div id="chatModal" class="modal">
  <div class="modal-content chat-modal">
    <div class="chat-header">
      <div class="seller-info">
        <h3 id="sellerName"></h3>
        <p id="sellerCompany"></p>
        <small id="productName"></small>
      </div>
      <span class="close" onclick="closeChatModal()">&times;</span>
    </div>
    
    <div id="chatMessages" class="chat-messages">
      <!-- Messages will be loaded here -->
    </div>
    
    <div class="chat-input-container">
      <input 
        type="text" 
        id="messageInput" 
        placeholder="Type your message..." 
        onkeypress="handleEnterKey(event)"
      >
      <button onclick="sendMessage()">Send</button>
    </div>
  </div>
</div>
```

### **4. Socket.IO Integration**

```javascript
// Initialize socket connection
const socket = io('your-server-url');
window.socket = socket;

// === PRODUCT CHAT EVENTS ===

// Listen for incoming product messages
socket.on('receiveProductMessage', (message) => {
  if (window.currentProductChat && message.productId === window.currentProductChat.productId) {
    addMessageToProductChat(window.currentProductChat.productId, message);
  }
  
  // Show notification if not in current chat
  if (!window.currentProductChat || message.productId !== window.currentProductChat.productId) {
    showProductChatNotification(message);
  }
});

// Listen for product typing indicators
socket.on('userTyping', (data) => {
  if (window.currentProductChat && data.userId !== getCurrentUserId()) {
    showTypingIndicator(data.isTyping);
  }
});

// === QUOTE CHAT EVENTS (Original) ===

// Listen for incoming quote messages
socket.on('receiveQuoteMessage', (message) => {
  if (window.currentChat && message.quoteId === window.currentChat.quoteId) {
    addMessageToChat(message);
  }
});

// === COMMON EVENTS ===

// Handle connection
socket.on('connect', () => {
  console.log('Connected to chat server');
  // Join user's personal room
  socket.emit('join', getCurrentUserId());
});

// Handle disconnection
socket.on('disconnect', () => {
  console.log('Disconnected from chat server');
});

// Error handling
socket.on('messageError', (error) => {
  console.error('Chat error:', error);
  alert('Failed to send message: ' + error.error);
});

// Message sent confirmation
socket.on('messageSent', (message) => {
  console.log('Message sent successfully:', message);
});

// === HELPER FUNCTIONS ===

// Send typing indicator for product chat
function sendProductTypingIndicator(productId, isTyping) {
  if (socket) {
    socket.emit('typing', {
      productId: productId,
      userId: getCurrentUserId(),
      isTyping: isTyping
    });
  }
}

// Show typing indicator
function showTypingIndicator(isTyping) {
  const indicator = document.getElementById('typingIndicator');
  if (indicator) {
    indicator.style.display = isTyping ? 'block' : 'none';
  }
}

// Show product chat notification
function showProductChatNotification(message) {
  // Implement notification logic
  console.log('New product message:', message);
  // You can show a toast notification, update badge count, etc.
}

// Get current user ID from your auth system
function getCurrentUserId() {
  // Return the current logged-in user's ID
  return localStorage.getItem('userId') || 'anonymous';
}
```

### **5. CSS Styles**

```css
.chat-supplier-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.modal {
  display: none;
  position: fixed;
  z-index: 1000;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0,0,0,0.4);
}

.chat-modal {
  background-color: #fefefe;
  margin: 5% auto;
  padding: 0;
  border: none;
  width: 80%;
  max-width: 600px;
  height: 70vh;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
}

.chat-header {
  padding: 16px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chat-messages {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  max-height: calc(70vh - 120px);
}

.message {
  margin-bottom: 16px;
  display: flex;
}

.message.sent {
  justify-content: flex-end;
}

.message.received {
  justify-content: flex-start;
}

.message-content {
  max-width: 70%;
  padding: 8px 12px;
  border-radius: 8px;
}

.message.sent .message-content {
  background-color: #007bff;
  color: white;
}

.message.received .message-content {
  background-color: #e9ecef;
  color: #333;
}

.chat-input-container {
  padding: 16px;
  border-top: 1px solid #eee;
  display: flex;
  gap: 8px;
}

.chat-input-container input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.chat-input-container button {
  padding: 8px 16px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
```

## 🎯 Usage Flows

### **Product Detail Page Chat Flow**
1. **Buyer visits product detail page** and sees "Chat with Supplier" button
2. **System loads enhanced product info** with chat capabilities
3. **Buyer clicks chat button** → opens product-specific chat modal
4. **Direct buyer-seller conversation** about the specific product
5. **Real-time messaging** via Socket.IO with product context
6. **Seller gets notified** and can respond about their product

### **Quote Request Chat Flow** (Original)
1. **Buyer clicks "Chat with Supplier"** on a quote request
2. **System fetches seller info** for that specific quote
3. **Chat modal opens** with seller details and quote context
4. **Buyer can send messages** related to the quote
5. **Real-time messaging** via Socket.IO
6. **Seller receives notifications** and can respond
7. **Conversation is contextual** to the specific quote

## 📱 Features Included

### **Core Chat Features**
- ✅ **Two chat contexts**: Product-based and Quote-based
- ✅ **Real-time messaging** via Socket.IO
- ✅ **Message persistence** in database
- ✅ **Read status tracking**
- ✅ **Typing indicators**
- ✅ **Authentication required**
- ✅ **Responsive design**

### **Product Detail Page Features**
- ✅ **Enhanced product API** with chat information
- ✅ **Direct buyer-seller communication** from product pages
- ✅ **Product-specific chat rooms** and conversations
- ✅ **Seller and buyer perspectives** for product inquiries

### **Quote Request Features** (Original)
- ✅ **Quote-specific chats** (each quote has its own conversation)
- ✅ **Seller and buyer perspectives** for quote discussions
- ✅ **Conversation history** tied to quotes
- ✅ **Contextual messaging** about specific quote requirements

## 🚀 Getting Started

1. **For Product Detail Pages**: Use the enhanced `/api/product/detail/:id` endpoint to get chat information
2. **For Quote Requests**: Use the existing `/api/chat/buyer-seller/` and `/api/chat/seller/` endpoints
3. **Socket.IO**: Connect and listen for both `receiveProductMessage` and `receiveQuoteMessage` events
4. **Authentication**: Ensure users are logged in before allowing chat access

This implementation provides a complete dual-context buyer-seller chat system that works both for direct product inquiries and quote-specific discussions!
