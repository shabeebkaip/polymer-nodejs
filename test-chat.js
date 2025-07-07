#!/usr/bin/env node

// Quick Chat System Test Script
// Run with: node test-chat.js

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';
const TEST_TOKEN = 'your-test-token-here'; // Replace with actual token

// Colors for console output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testAPI(endpoint, method = 'GET', body = null, token = TEST_TOKEN) {
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            },
            ...(body && { body: JSON.stringify(body) })
        };

        const response = await fetch(`${BASE_URL}${endpoint}`, options);
        const data = await response.json();
        
        if (response.ok) {
            log(`✅ ${method} ${endpoint} - SUCCESS`, 'green');
            return { success: true, data };
        } else {
            log(`❌ ${method} ${endpoint} - FAILED: ${data.message || 'Unknown error'}`, 'red');
            return { success: false, error: data };
        }
    } catch (error) {
        log(`❌ ${method} ${endpoint} - ERROR: ${error.message}`, 'red');
        return { success: false, error: error.message };
    }
}

async function runChatTests() {
    log('\n🚀 Starting Chat System Tests...', 'blue');
    log('=' * 50, 'blue');

    // Test 1: Server Health Check
    log('\n📡 Testing Server Connection...', 'yellow');
    const healthCheck = await testAPI('/api/auth/sidebar', 'GET', null, null);
    
    if (!healthCheck.success) {
        log('❌ Server is not running or not accessible', 'red');
        log('💡 Make sure your server is running on http://localhost:3000', 'yellow');
        return;
    }

    // Test 2: Product Detail API (Enhanced)
    log('\n📦 Testing Enhanced Product Detail API...', 'yellow');
    const productId = '60f7b3b3b3b3b3b3b3b3b3b3'; // Replace with actual product ID
    const productDetail = await testAPI(`/api/product/detail/${productId}`);
    
    if (productDetail.success && productDetail.data.chatInfo) {
        log('✅ Product detail includes chat functionality', 'green');
        log(`   - Chat enabled: ${productDetail.data.chatInfo.chatEnabled}`, 'blue');
        log(`   - Can chat: ${productDetail.data.chatInfo.canChat}`, 'blue');
    } else {
        log('⚠️  Product detail may not include chat info', 'yellow');
    }

    // Test 3: Chat API Endpoints (requires authentication)
    if (TEST_TOKEN !== 'your-test-token-here') {
        log('\n💬 Testing Chat APIs...', 'yellow');
        
        // Test product chat endpoints
        await testAPI(`/api/chat/product/seller-info/${productId}`);
        await testAPI(`/api/chat/product/conversations`);
        
        // Test sending a message
        await testAPI(`/api/chat/product/send-message/${productId}`, 'POST', {
            message: 'Test message from automated test'
        });
        
        // Test quote chat endpoints
        const quoteId = '60f7b3b3b3b3b3b3b3b3b3b4'; // Replace with actual quote ID
        await testAPI(`/api/chat/buyer-seller/seller-info/${quoteId}`);
        await testAPI(`/api/chat/buyer-seller/conversations`);
        
    } else {
        log('\n⚠️  Skipping authenticated API tests', 'yellow');
        log('💡 Replace TEST_TOKEN in script with actual token to test APIs', 'blue');
    }

    // Test 4: Database Model Check
    log('\n🗄️  Testing Database Models...', 'yellow');
    try {
        // This would require importing your models
        log('💡 Manual check required: Verify Message model has productId and quoteId fields', 'blue');
    } catch (error) {
        log(`❌ Database model test failed: ${error.message}`, 'red');
    }

    log('\n🏁 Chat System Test Complete!', 'blue');
    log('=' * 50, 'blue');
    
    // Test Summary
    log('\n📋 Manual Testing Steps:', 'yellow');
    log('1. Open browser developer tools', 'blue');
    log('2. Navigate to a product detail page', 'blue');
    log('3. Check if "Chat with Supplier" button appears', 'blue');
    log('4. Click button and verify chat modal opens', 'blue');
    log('5. Send a test message and check database', 'blue');
    log('6. Test real-time messaging with Socket.IO', 'blue');
    
    log('\n🔧 Socket.IO Test:', 'yellow');
    log('- Open browser console on product page', 'blue');
    log('- Run: socket.emit("joinProductChat", {userId: "test", productId: "' + productId + '"})', 'blue');
    log('- Check for connection and room join messages in server logs', 'blue');
}

// Socket.IO Test Helper
function generateSocketTestCode(productId = 'test-product-id') {
    return `
// Copy and paste this in browser console to test Socket.IO:

const socket = io();
const testUserId = 'test-user-${Date.now()}';
const testProductId = '${productId}';

socket.on('connect', () => {
    console.log('✅ Socket connected:', socket.id);
    socket.emit('join', testUserId);
    socket.emit('joinProductChat', { userId: testUserId, productId: testProductId });
});

socket.on('receiveProductMessage', (msg) => {
    console.log('📨 Received product message:', msg);
});

socket.on('messageError', (error) => {
    console.error('❌ Message error:', error);
});

socket.on('messageSent', (msg) => {
    console.log('✅ Message sent:', msg);
});

// Send test message
function sendTestMessage() {
    socket.emit('sendProductMessage', {
        senderId: testUserId,
        receiverId: 'test-seller-id',
        message: 'Test message from browser console',
        productId: testProductId
    });
}

console.log('🧪 Socket.IO test loaded! Run sendTestMessage() to test.');
`;
}

// Run the tests
if (process.argv[2] === '--socket-code') {
    console.log(generateSocketTestCode(process.argv[3]));
} else {
    runChatTests().catch(console.error);
}
