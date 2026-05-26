import mongoose from 'mongoose';

async function check() {
  try {
    console.log('Connecting to mongodb://localhost:27017/social_media ...');
    await mongoose.connect('mongodb://localhost:27017/social_media');
    console.log('Success: Connected successfully!');
    
    const count = await mongoose.connection.db.collection('posts').countDocuments();
    console.log(`Success: Found ${count} posts in the "posts" collection!\n`);
    
    const posts = await mongoose.connection.db.collection('posts').find().toArray();
    console.log('Posts currently stored in local MongoDB:');
    posts.forEach((p, i) => {
      console.log(`[${i+1}] User: ${p.user} | Likes: ${p.likes} | Content: "${p.content.substring(0, 60)}..."`);
    });
    process.exit(0);
  } catch (err) {
    console.error('Error connecting to MongoDB:', err.message);
    process.exit(1);
  }
}
check();
