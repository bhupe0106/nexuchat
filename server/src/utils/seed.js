/**
 * NexusChat Seed Script
 * Creates demo users, conversations, and sample messages for testing.
 *
 * Usage:  cd server && node src/utils/seed.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

const DEMO_USERS = [
  {
    username: 'demo',
    email: 'demo@nexus.chat',
    password: 'demo123456',
    bio: 'NexusChat demo account 🚀',
  },
  {
    username: 'alice',
    email: 'alice@nexus.chat',
    password: 'alice123456',
    bio: 'Design lead & coffee enthusiast ☕',
  },
  {
    username: 'bob',
    email: 'bob@nexus.chat',
    password: 'bob123456',
    bio: 'Full-stack dev | Open source contributor',
  },
  {
    username: 'carol',
    email: 'carol@nexus.chat',
    password: 'carol123456',
    bio: 'Product manager | Making things happen',
  },
  {
    username: 'dave',
    email: 'dave@nexus.chat',
    password: 'dave123456',
    bio: 'DevOps engineer | Cloud native ☁️',
  },
];

const SAMPLE_MESSAGES = [
  { content: 'Hey! Welcome to NexusChat 🎉', type: 'text' },
  { content: 'This is a demo conversation to show how the app works.', type: 'text' },
  { content: 'You can use the AI assistant by clicking the ⚡ button in the top-right!', type: 'text' },
  { content: 'Try sending a voice message or sharing an image too 📎', type: 'text' },
  { content: 'You can also translate any message to your preferred language 🌐', type: 'text' },
];

async function seed() {
  try {
    console.log('🌱 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected\n');

    // Ask for confirmation if not in --force mode
    if (!process.argv.includes('--force')) {
      const count = await User.countDocuments();
      if (count > 0) {
        console.log(`⚠️  Database already has ${count} user(s).`);
        console.log('   Run with --force to reseed (WARNING: deletes existing data)\n');
        process.exit(0);
      }
    } else {
      console.log('🗑️  Clearing existing data...');
      await Promise.all([
        User.deleteMany({}),
        Conversation.deleteMany({}),
        Message.deleteMany({}),
      ]);
      console.log('✅ Cleared\n');
    }

    // Create users
    console.log('👤 Creating demo users...');
    const createdUsers = [];
    for (const userData of DEMO_USERS) {
      const user = await User.create(userData);
      createdUsers.push(user);
      console.log(`   ✅ ${user.username} (${user.email})`);
    }

    // Create DM conversation between demo and alice
    console.log('\n💬 Creating demo conversations...');
    const conv1 = await Conversation.create({
      participants: [createdUsers[0]._id, createdUsers[1]._id],
      isGroup: false,
    });

    // Add sample messages
    let lastMsg;
    for (let i = 0; i < SAMPLE_MESSAGES.length; i++) {
      const msg = await Message.create({
        conversationId: conv1._id,
        sender: i % 2 === 0 ? createdUsers[1]._id : createdUsers[0]._id,
        content: SAMPLE_MESSAGES[i].content,
        type: SAMPLE_MESSAGES[i].type,
        sentiment: { label: 'positive', score: 0.8 },
        createdAt: new Date(Date.now() - (SAMPLE_MESSAGES.length - i) * 60000),
      });
      lastMsg = msg;
    }
    await Conversation.findByIdAndUpdate(conv1._id, {
      lastMessage: lastMsg._id,
      lastMessageAt: lastMsg.createdAt,
    });
    console.log('   ✅ DM conversation: demo ↔ alice');

    // Create a group conversation
    const groupConv = await Conversation.create({
      participants: createdUsers.map((u) => u._id),
      isGroup: true,
      groupName: '🚀 NexusChat Team',
      groupDescription: 'Welcome to the demo team chat!',
      admin: createdUsers[0]._id,
    });

    const groupMsg = await Message.create({
      conversationId: groupConv._id,
      sender: createdUsers[0]._id,
      content: 'Welcome everyone to the team chat! 🎉 This is NexusChat group messaging.',
      type: 'text',
      sentiment: { label: 'positive', score: 0.9 },
    });
    await Conversation.findByIdAndUpdate(groupConv._id, {
      lastMessage: groupMsg._id,
      lastMessageAt: groupMsg.createdAt,
    });
    console.log('   ✅ Group conversation: NexusChat Team (5 members)');

    // DM between demo and bob
    const conv2 = await Conversation.create({
      participants: [createdUsers[0]._id, createdUsers[2]._id],
      isGroup: false,
    });
    const msg2 = await Message.create({
      conversationId: conv2._id,
      sender: createdUsers[2]._id,
      content: 'Hey! Have you tried the AI chat feature? It\'s really useful 🤖',
      type: 'text',
      sentiment: { label: 'positive', score: 0.75 },
    });
    await Conversation.findByIdAndUpdate(conv2._id, {
      lastMessage: msg2._id,
      lastMessageAt: msg2.createdAt,
    });
    console.log('   ✅ DM conversation: demo ↔ bob');

    console.log('\n🎉 Seed complete!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Demo login credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    DEMO_USERS.forEach((u) => {
      console.log(`  📧 ${u.email.padEnd(25)} 🔑 ${u.password}`);
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

seed();
