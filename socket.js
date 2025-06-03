import Message from "./models/message.js";


export default function initSocket(io) {
    io.on('connection', (socket) => {
        console.log('Socket Connected:', socket.id);

        socket.on('join', (userId) => {
            socket.join(userId);
        });

        socket.on('sendMessage', async ({ senderId, receiverId, message }) => {
            const newMsg = new Message({ senderId, receiverId, message });
            await newMsg.save();
            io.to(receiverId).emit('receiveMessage', newMsg);
        });

        socket.on('disconnect', () => {
            console.log('Socket disconnected:', socket.id);
        });
    });
}
