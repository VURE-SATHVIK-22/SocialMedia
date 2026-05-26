import Post from '../models/Post.js';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

// Seed initial posts if DB is empty
const seedInitialPosts = async () => {
  try {
    const postCount = await Post.countDocuments();
    if (postCount === 0) {
      console.log('Seeding dummy users for initial posts...');
      
      // Check or create dummy users
      const dummyUserData = [
        {
          username: 'sarahj',
          name: 'Sarah Jenkins',
          avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=sarahj'
        },
        {
          username: 'dchen',
          name: 'David Chen',
          avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=dchen'
        },
        {
          username: 'mayadesigns',
          name: 'Maya Patel',
          avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=mayadesigns'
        }
      ];

      const dummyUsers = {};
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('dummy123', salt);

      for (const u of dummyUserData) {
        let user = await User.findOne({ username: u.username });
        if (!user) {
          user = await User.create({
            username: u.username,
            name: u.name,
            avatar: u.avatar,
            password: hashedPassword
          });
        }
        dummyUsers[u.username] = user._id;
      }

      const initialPosts = [
        {
          user: dummyUsers['sarahj'],
          content: "Just finished setting up my new workspace! What do you guys think? 🪴💻",
          image: "https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1400&q=80",
          likes: [],
          comments: [],
          shares: 12
        },
        {
          user: dummyUsers['dchen'],
          content: "Exploring the latest features in React 19. The new use() hook is going to change how we fetch data completely! 🚀 #ReactJS #WebDev",
          likes: [],
          comments: [],
          shares: 5
        },
        {
          user: dummyUsers['mayadesigns'],
          content: "Wandering through the streets of Tokyo. The blend of traditional and ultra-modern architecture is just mind-blowing. 🎌✨",
          image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?ixlib=rb-4.0.3&auto=format&fit=crop&w=1400&q=80",
          likes: [],
          comments: [],
          shares: 45
        }
      ];

      await Post.insertMany(initialPosts);
      console.log('Database seeded successfully with initial posts linked to seeded users!');
    }
  } catch (error) {
    console.error('Error seeding database:', error.message);
  }
};

// Get all posts
export const getPosts = async (req, res) => {
  try {
    // Seed posts if DB is empty
    await seedInitialPosts();

    const posts = await Post.find()
      .populate('user', 'name username avatar')
      .populate('comments.user', 'name username avatar')
      .sort({ createdAt: -1 });

    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Server Error fetching posts', error: error.message });
  }
};

// Create a post
export const createPost = async (req, res) => {
  const { content, image } = req.body;
  if (!content) {
    return res.status(400).json({ message: 'Content is required' });
  }

  try {
    const newPost = new Post({
      user: req.user._id,
      content,
      image: image || '',
      likes: [],
      comments: [],
      shares: 0
    });

    const savedPost = await newPost.save();
    const populatedPost = await Post.findById(savedPost._id)
      .populate('user', 'name username avatar');

    res.status(201).json(populatedPost);
  } catch (error) {
    res.status(500).json({ message: 'Server Error creating post', error: error.message });
  }
};

// Toggle like
export const toggleLikePost = async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  try {
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const likeIndex = post.likes.indexOf(userId);

    if (likeIndex > -1) {
      // User already liked it, so unlike
      post.likes.splice(likeIndex, 1);
    } else {
      // Like the post
      post.likes.push(userId);
    }

    await post.save();
    
    const updatedPost = await Post.findById(id)
      .populate('user', 'name username avatar')
      .populate('comments.user', 'name username avatar');

    res.status(200).json(updatedPost);
  } catch (error) {
    res.status(500).json({ message: 'Server Error toggling like', error: error.message });
  }
};

// Add comment to a post
export const createComment = async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ message: 'Comment content is required' });
  }

  try {
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    post.comments.push({
      user: req.user._id,
      content
    });

    await post.save();

    const updatedPost = await Post.findById(id)
      .populate('user', 'name username avatar')
      .populate('comments.user', 'name username avatar');

    res.status(201).json(updatedPost);
  } catch (error) {
    res.status(500).json({ message: 'Server Error adding comment', error: error.message });
  }
};
