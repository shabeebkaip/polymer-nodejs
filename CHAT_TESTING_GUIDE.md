# Chat System Testing Guide

## 🧪 How to Test the Chat Functionality

### 1. **Server Startup Test**

First, make sure your server starts without errors:

```bash
# Start your Node.js server
npm start
# or
node index.js

# Look for these console messages:
# ✅ "Socket Connected: [socket-id]" when someone connects
# ✅ "User [userId] joined their room" when user joins
# ✅ "User [userId] joined product chat room: product_[productId]" for product chats
```

### 2. **Database Connection Test**

Check if the Message model is working:

```bash
# Open MongoDB shell or check your database
# Verify the messages collection exists and has the right schema
```

### 3. **API Endpoints Testing**

Use these curl commands or Postman to test the APIs:

#### **Product Chat APIs:**

```bash
# Test 1: Get product detail with chat info
curl -X GET "http://localhost:3000/api/product/detail/[PRODUCT_ID]" \
  -H "Authorization: Bearer [YOUR_TOKEN]"

# Expected response should include chatInfo object

# Test 2: Get seller info for product
curl -X GET "http://localhost:3000/api/chat/product/seller-info/[PRODUCT_ID]" \
  -H "Authorization: Bearer [YOUR_TOKEN]"

# Test 3: Send a product message
curl -X POST "http://localhost:3000/api/chat/product/send-message/[PRODUCT_ID]" \
  -H "Authorization: Bearer [YOUR_TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, I am interested in this product"}'

# Test 4: Get product messages
curl -X GET "http://localhost:3000/api/chat/product/messages/[PRODUCT_ID]" \
  -H "Authorization: Bearer [YOUR_TOKEN]"

# Test 5: Get all product conversations
curl -X GET "http://localhost:3000/api/chat/product/conversations" \
  -H "Authorization: Bearer [YOUR_TOKEN]"
```

#### **Quote Chat APIs (Original):**

```bash
# Test seller info for quote
curl -X GET "http://localhost:3000/api/chat/buyer-seller/seller-info/[QUOTE_ID]" \
  -H "Authorization: Bearer [YOUR_TOKEN]"

# Send quote message
curl -X POST "http://localhost:3000/api/chat/buyer-seller/send-message/[QUOTE_ID]" \
  -H "Authorization: Bearer [YOUR_TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{"message": "I have a question about this quote"}'
```

### 4. **Socket.IO Testing**

Create a simple HTML test page to test real-time functionality:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Chat Test</title>
    <script src="/socket.io/socket.io.js"></script>
</head>
<body>
    <div id="messages"></div>
    <input type="text" id="messageInput" placeholder="Type message...">
    <button onclick="sendTestMessage()">Send</button>
    
    <script>
        const socket = io();
        const userId = 'test-user-id'; // Replace with actual user ID
        const productId = 'test-product-id'; // Replace with actual product ID
        
        // Connect and join room
        socket.on('connect', () => {
            console.log('Connected:', socket.id);
            socket.emit('join', userId);
            socket.emit('joinProductChat', { userId, productId });
        });
        
        // Listen for messages
        socket.on('receiveProductMessage', (message) => {
            console.log('Received message:', message);
            document.getElementById('messages').innerHTML += 
                `<div>${message.senderName}: ${message.message}</div>`;
        });
        
        // Send test message
        function sendTestMessage() {
            const message = document.getElementById('messageInput').value;
            socket.emit('sendProductMessage', {
                senderId: userId,
                receiverId: 'seller-user-id', // Replace with seller ID
                message: message,
                productId: productId
            });
            document.getElementById('messageInput').value = '';
        }
        
        // Error handling
        socket.on('messageError', (error) => {
            console.error('Message error:', error);
            alert('Error: ' + error.error);
        });
        
        socket.on('messageSent', (message) => {
            console.log('Message sent successfully:', message);
        });
    </script>
</body>
</html>
```

### 5. **Step-by-Step Manual Testing**

#### **Test Product Chat Flow:**

1. **Setup Test Data:**
   - Create a test product with a seller
   - Create a test buyer account
   - Get valid user tokens

2. **Test Product Detail API:**
   ```bash
   # Replace PRODUCT_ID with actual product ID
   curl -X GET "http://localhost:3000/api/product/detail/PRODUCT_ID"
   ```
   - ✅ Check if response includes `chatInfo` object
   - ✅ Verify `canChat` is true
   - ✅ Confirm seller information is present

3. **Test Chat APIs as Buyer:**
   ```bash
   # Get seller info
   curl -X GET "http://localhost:3000/api/chat/product/seller-info/PRODUCT_ID" \
     -H "Authorization: Bearer BUYER_TOKEN"
   
   # Send message
   curl -X POST "http://localhost:3000/api/chat/product/send-message/PRODUCT_ID" \
     -H "Authorization: Bearer BUYER_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"message": "Hello seller!"}'
   
   # Get messages
   curl -X GET "http://localhost:3000/api/chat/product/messages/PRODUCT_ID" \
     -H "Authorization: Bearer BUYER_TOKEN"
   ```

4. **Test Chat APIs as Seller:**
   ```bash
   # Get conversations
   curl -X GET "http://localhost:3000/api/chat/seller-product/conversations" \
     -H "Authorization: Bearer SELLER_TOKEN"
   
   # Get messages for specific buyer
   curl -X GET "http://localhost:3000/api/chat/seller-product/messages/PRODUCT_ID/BUYER_ID" \
     -H "Authorization: Bearer SELLER_TOKEN"
   
   # Send reply
   curl -X POST "http://localhost:3000/api/chat/seller-product/send-message/PRODUCT_ID/BUYER_ID" \
     -H "Authorization: Bearer SELLER_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"message": "Hello buyer, thanks for your interest!"}'
   ```

### 6. **Common Issues to Check**

#### **🔍 Server Issues:**
- ✅ Check server console for errors
- ✅ Verify MongoDB connection
- ✅ Ensure Socket.IO is properly initialized
- ✅ Check if all routes are registered

#### **🔍 Database Issues:**
- ✅ Verify Message model has productId and quoteId fields
- ✅ Check if database indexes are created
- ✅ Ensure user authentication is working

#### **🔍 API Issues:**
- ✅ Check if all chat routes are registered in main router
- ✅ Verify authentication middleware is working
- ✅ Test with valid user tokens
- ✅ Check request/response formats

#### **🔍 Socket.IO Issues:**
- ✅ Verify Socket.IO client can connect
- ✅ Check if events are being emitted/received
- ✅ Test room joining functionality
- ✅ Verify message broadcasting

### 7. **Expected Results**

#### **✅ Successful Product Chat Test:**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "_id": "message_id",
    "senderId": "buyer_id",
    "receiverId": "seller_id", 
    "message": "Hello seller!",
    "productId": "product_id",
    "createdAt": "2025-07-07T...",
    "isRead": false
  }
}
```

#### **✅ Successful Socket Connection:**
```
Console logs:
- "Connected: socket_id"
- "User user_id joined their room"
- "User user_id joined product chat room: product_product_id"
```

#### **✅ Successful Real-time Message:**
```json
{
  "_id": "message_id",
  "message": "Hello seller!",
  "senderId": "buyer_id",
  "receiverId": "seller_id",
  "senderName": "Buyer Name",
  "senderCompany": "Buyer Company",
  "productId": "product_id",
  "createdAt": "2025-07-07T...",
  "isRead": false
}
```

## 🎯 Quick Test Checklist

- [ ] Server starts without errors
- [ ] Socket.IO connects successfully  
- [ ] Product detail API returns chatInfo
- [ ] Can send product messages via API
- [ ] Can receive messages in real-time
- [ ] Messages are saved to database
- [ ] Both buyer and seller perspectives work
- [ ] Authentication is enforced
- [ ] Error handling works properly

Run through this checklist to ensure your chat system is fully functional!
