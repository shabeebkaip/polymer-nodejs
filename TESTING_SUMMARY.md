# ✅ How to Test Your Chat System

## 🚀 Quick Start Testing

### 1. **Start Your Server**
```bash
npm start
# or
node index.js
```

**Expected output:**
```
Database connected successfully
🚀 Server connected at http://localhost:3000
🧪 Chat test page: http://localhost:3000/chat-test
📡 Socket.IO ready for connections
```

### 2. **Basic Connectivity Test**
Open your browser and go to: **http://localhost:3000/chat-test**

This test page will help you verify:
- ✅ Socket.IO connection
- ✅ Product chat functionality  
- ✅ Quote chat functionality
- ✅ API endpoints
- ✅ Real-time messaging

### 3. **API Testing with curl**

#### Test Enhanced Product Detail API:
```bash
# Replace PRODUCT_ID with an actual product ID from your database
curl -X GET "http://localhost:3000/api/product/detail/PRODUCT_ID"

# Look for the chatInfo object in response:
# {
#   "success": true,
#   "data": {
#     ...product data...,
#     "chatInfo": {
#       "canChat": true,
#       "endpoints": {...},
#       "socketEvents": {...}
#     }
#   }
# }
```

#### Test Product Chat APIs:
```bash
# Get seller info for product (requires auth token)
curl -X GET "http://localhost:3000/api/chat/product/seller-info/PRODUCT_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Send message to seller about product
curl -X POST "http://localhost:3000/api/chat/product/send-message/PRODUCT_ID" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, I am interested in this product"}'

# Get conversation history
curl -X GET "http://localhost:3000/api/chat/product/messages/PRODUCT_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🧪 Step-by-Step Manual Testing

### **Step 1: Verify Server Setup**
1. ✅ Server starts without errors
2. ✅ Database connects successfully
3. ✅ Socket.IO initializes properly
4. ✅ Test page loads at `/chat-test`

### **Step 2: Test Product Detail Enhancement**
1. Call `/api/product/detail/{productId}` for any existing product
2. ✅ Response includes `chatInfo` object
3. ✅ `chatInfo.canChat` is true
4. ✅ `chatInfo.endpoints` contains API URLs
5. ✅ `chatInfo.socketEvents` contains Socket events

### **Step 3: Test Socket.IO Connection**
1. Open `/chat-test` page in browser
2. Click "Test Connection"
3. ✅ See "Connected to server" message
4. ✅ Check browser dev tools for Socket connection
5. ✅ Check server console for connection logs

### **Step 4: Test Product Chat Flow**
Using the test page:
1. Enter test User ID, Product ID, and Seller ID
2. Click "Join Product Chat"
3. ✅ See "Joined product chat room" message
4. Type a message and click "Send Message"
5. ✅ Message appears in logs
6. ✅ Check server console for message processing
7. ✅ Check database for saved message

### **Step 5: Test Real-time Messaging**
1. Open the test page in two browser tabs
2. Use different User IDs in each tab
3. Join the same product chat in both tabs
4. Send messages from one tab
5. ✅ Messages appear in real-time in other tab

## 🔍 What to Look For

### **Server Console Logs:**
```
✅ Socket Connected: ABC123
✅ User test-user joined their room
✅ User test-user joined product chat room: product_test-product-123
✅ User test-user joined quote chat room: quote_test-quote-123
```

### **Browser Console (Success):**
```javascript
✅ Socket connected: ABC123
✅ Joined personal room for user: test-user
✅ Message sent successfully
📨 Received product message: {...}
```

### **API Response (Success):**
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

### **Database Check:**
```javascript
// Check MongoDB messages collection
db.messages.find().sort({createdAt: -1}).limit(5)

// Should show recent messages with productId or quoteId fields
```

## 🚨 Common Issues & Solutions

### **Issue: Socket.IO not connecting**
**Solution:**
- Check if server is using the HTTP server instance (not app.listen)
- Verify CORS settings allow your origin
- Check browser developer tools for connection errors

### **Issue: Chat APIs returning 401/403**
**Solution:**
- Ensure you're sending valid authorization token
- Check if user is authenticated properly
- Verify token format: `Bearer YOUR_TOKEN`

### **Issue: Messages not saving to database**
**Solution:**
- Check MongoDB connection
- Verify Message model has productId and quoteId fields
- Check server console for database errors

### **Issue: Real-time messages not working**
**Solution:**
- Verify both users joined the same chat room
- Check Socket.IO event names match exactly
- Ensure room names are consistent (product_ID format)

## ⚡ Quick Automation Test

Run the automated test script:
```bash
# First, edit the script to add your actual test token
node test-chat.js

# For Socket.IO test code generation:
node test-chat.js --socket-code your-product-id
```

## 🎯 Success Checklist

- [ ] Server starts and shows Socket.IO ready message
- [ ] Test page loads at `/chat-test`
- [ ] Socket.IO connects successfully
- [ ] Product detail API includes chatInfo
- [ ] Can join product chat rooms
- [ ] Can send messages via API
- [ ] Messages save to database with productId
- [ ] Real-time messaging works between browser tabs
- [ ] Can send and receive both product and quote messages
- [ ] Authentication is enforced on protected routes
- [ ] Error handling works (try invalid data)

## 🏁 Final Verification

**Your chat system is working if:**
1. ✅ Buyers can see "Chat with Supplier" option on product pages
2. ✅ Product detail API provides all chat information
3. ✅ Real-time messages work between buyer and seller
4. ✅ Messages are contextual to specific products or quotes
5. ✅ Both sides (buyer/seller) can send and receive messages
6. ✅ All messages persist in the database
7. ✅ Authentication prevents unauthorized access

**🎉 Congratulations! Your chat system is ready for production!**
