import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { connectDB } from './config/db.js';
import postRoutes from './routes/postRoutes.js';
import authRoutes from './routes/authRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import Message from './models/Message.js';
import User from './models/User.js';

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();
const httpServer = createServer(app);

// Configure WebSockets
const io = new Server(httpServer, {
  cors: {
    origin: '*', // Allow all origins for local development, adjust as needed
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// REST Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/messages', messageRoutes);

// Base Route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Real-Time Social Media API' });
});

// Socket.io Real-Time Operations
// Map to track online users: userId -> socketId
const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // Register user socket
  socket.on('register', async (userId) => {
    if (!userId) return;
    
    // Map user to their socket
    onlineUsers.set(userId, socket.id);
    socket.userId = userId;
    
    console.log(`User ${userId} registered with socket ${socket.id}`);
    
    // Set user status to online/update front-end lists
    // Broadcast list of currently online user IDs
    io.emit('online_users', Array.from(onlineUsers.keys()));
  });

  // Handle Real-Time Direct Message
  socket.on('send_message', async ({ senderId, recipientId, content }) => {
    if (!senderId || !recipientId || !content.trim()) return;

    try {
      // Save message to database
      const message = await Message.create({
        sender: senderId,
        recipient: recipientId,
        content: content.trim()
      });

      const populatedMessage = await Message.findById(message._id)
        .populate('sender', 'name username avatar')
        .populate('recipient', 'name username avatar');

      // Send to recipient if online
      const recipientSocketId = onlineUsers.get(recipientId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('receive_message', populatedMessage);
      }

      // Send back to sender for visual sync
      socket.emit('message_sent', populatedMessage);
      
    } catch (err) {
      console.error('Error saving socket message:', err.message);
      socket.emit('message_error', { error: 'Failed to send message' });
    }
  });

  // Handle live notifications/broadcasting
  // Broadcast a live post update
  socket.on('post_created', (post) => {
    // Broadcast to everyone else
    socket.broadcast.emit('new_post', post);
  });

  // Broadcast a live post like/comment update
  socket.on('post_updated', (updatedPost) => {
    // Broadcast to everyone
    io.emit('update_post', updatedPost);
  });

  // Handle user typing indicators
  socket.on('typing', ({ senderId, recipientId }) => {
    const recipientSocketId = onlineUsers.get(recipientId);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('typing', { senderId });
    }
  });

  socket.on('stop_typing', ({ senderId, recipientId }) => {
    const recipientSocketId = onlineUsers.get(recipientId);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('stop_typing', { senderId });
    }
  });

  // Handle Disconnect
  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
    
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      console.log(`User ${socket.userId} removed from online list`);
      
      // Broadcast updated online list
      io.emit('online_users', Array.from(onlineUsers.keys()));
    }
  });
});

// Port configuration
const PORT = process.env.PORT || 5050;

httpServer.listen(PORT, () => {
  console.log(`HTTP & WebSocket Server running on port ${PORT}`);
});
