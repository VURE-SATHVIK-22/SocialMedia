import Message from '../models/Message.js';
import User from '../models/User.js';

// @desc    Get all users for sidebar chat list (excluding current user)
// @route   GET /api/messages/users
// @access  Private
export const getChatUsers = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    // Get all users except the logged-in user
    const users = await User.find({ _id: { $ne: currentUserId } }).select('name username avatar');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server Error fetching users list', error: error.message });
  }
};

// @desc    Get message history between two users
// @route   GET /api/messages/:userId
// @access  Private
export const getMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, recipient: userId },
        { sender: userId, recipient: currentUserId }
      ]
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server Error fetching messages', error: error.message });
  }
};

// @desc    Send a message (HTTP fallback/logging)
// @route   POST /api/messages
// @access  Private
export const sendMessage = async (req, res) => {
  try {
    const { recipientId, content } = req.body;
    const senderId = req.user._id;

    if (!recipientId || !content) {
      return res.status(400).json({ message: 'Recipient ID and message content are required' });
    }

    const message = await Message.create({
      sender: senderId,
      recipient: recipientId,
      content
    });

    const populatedMessage = await message.populate('sender recipient', 'name username avatar');

    res.status(201).json(populatedMessage);
  } catch (error) {
    res.status(500).json({ message: 'Server Error sending message', error: error.message });
  }
};
