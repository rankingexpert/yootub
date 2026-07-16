import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    // Create admin user
    console.log('Creating admin user...');
    const adminPassword = await bcrypt.hash('Admin@123', 12);
    
    const admin = await prisma.user.upsert({
      where: { email: 'admin@youtube-clone.com' },
      update: {},
      create: {
        email: 'admin@youtube-clone.com',
        username: 'admin',
        passwordHash: adminPassword,
        fullName: 'System Administrator',
        role: UserRole.ADMIN,
        isVerified: true,
        isActive: true,
        channel: {
          create: {
            name: 'YouTube Clone Official',
            description: 'Official channel for the YouTube Clone platform',
            isVerified: true,
            isMonetized: true,
            customUrl: 'youtube-clone',
          },
        },
      },
    });

    console.log(`✅ Created admin user: ${admin.email}`);

    // Create demo creator
    console.log('Creating demo creator...');
    const creatorPassword = await bcrypt.hash('Creator@123', 12);
    
    const creator = await prisma.user.upsert({
      where: { email: 'creator@example.com' },
      update: {},
      create: {
        email: 'creator@example.com',
        username: 'tech_tutorials',
        passwordHash: creatorPassword,
        fullName: 'Tech Tutorials',
        bio: 'Sharing programming and technology tutorials',
        role: UserRole.CREATOR,
        isVerified: true,
        isActive: true,
        channel: {
          create: {
            name: 'Tech Tutorials',
            description: 'Learn programming, web development, and cloud computing',
            isVerified: true,
            isMonetized: true,
            customUrl: 'tech-tutorials',
            subscribers: 15000,
            totalViews: 250000,
            totalVideos: 50,
          },
        },
      },
    });

    console.log(`✅ Created creator user: ${creator.email}`);

    // Create sample videos
    console.log('Creating sample videos...');
    const channel = await prisma.channel.findUnique({
      where: { userId: creator.id },
    });

    if (channel) {
      const sampleVideos = [
        {
          title: 'Building a YouTube Clone with Next.js 15 and React 19',
          description: 'Complete tutorial on building a full-featured YouTube clone',
          category: 'HOWTO_STYLE',
          tags: ['nextjs', 'react', 'tutorial', 'web-development'],
          duration: 1800,
          views: 5000,
          likes: 320,
          originalUrl: 'https://example.com/videos/building-youtube-clone.mp4',
          hlsUrl: 'https://example.com/hls/building-youtube-clone.m3u8',
          status: 'READY',
          resolution: '1920x1080',
          fileSize: 500000000,
          publishDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
        {
          title: 'Advanced TypeScript Patterns for Large-Scale Applications',
          description: 'Learn advanced TypeScript patterns for enterprise applications',
          category: 'EDUCATION',
          tags: ['typescript', 'programming', 'software-engineering'],
          duration: 2400,
          views: 3200,
          likes: 210,
          originalUrl: 'https://example.com/videos/advanced-typescript.mp4',
          hlsUrl: 'https://example.com/hls/advanced-typescript.m3u8',
          status: 'READY',
          resolution: '1920x1080',
          fileSize: 750000000,
          publishDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        },
        {
          title: 'Kubernetes in Production: Best Practices',
          description: 'Deep dive into running Kubernetes in production',
          category: 'SCIENCE_TECH',
          tags: ['kubernetes', 'devops', 'containers', 'cloud'],
          duration: 3600,
          views: 1800,
          likes: 150,
          originalUrl: 'https://example.com/videos/kubernetes-production.mp4',
          hlsUrl: 'https://example.com/hls/kubernetes-production.m3u8',
          status: 'READY',
          resolution: '1920x1080',
          fileSize: 1000000000,
          publishDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        },
      ];

      for (const videoData of sampleVideos) {
        const video = await prisma.video.create({
          data: {
            ...videoData,
            channelId: channel.id,
            allowComments: true,
            allowRatings: true,
            isPublished: true,
            isPrivate: false,
            isUnlisted: false,
            madeForKids: false,
          },
        });

        console.log(`  ✅ Created video: ${video.title}`);

        // Add analytics for each video
        for (let i = 0; i < 7; i++) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          
          await prisma.videoAnalytics.create({
            data: {
              videoId: video.id,
              date: date,
              views: Math.floor(Math.random() * 100) + 1,
              uniqueViews: Math.floor(Math.random() * 80) + 1,
              likes: Math.floor(Math.random() * 20),
              dislikes: Math.floor(Math.random() * 5),
              shares: Math.floor(Math.random() * 10),
              avgWatchTime: Math.floor(Math.random() * 60) + 10,
              completionRate: Math.random() * 0.6 + 0.2,
            },
          });
        }
      }
    }

    // Create sample comments
    console.log('Creating sample comments...');
    const user = await prisma.user.findUnique({
      where: { email: 'creator@example.com' },
      include: { videos: { take: 1 } },
    });

    if (user && user.videos.length > 0) {
      const video = user.videos[0];
      
      const comments = [
        {
          content: 'This is an amazing tutorial! Really helped me understand the concepts.',
          userId: admin.id,
          videoId: video.id,
          isPinned: true,
          likes: 45,
        },
        {
          content: 'Great content! Looking forward to more videos like this.',
          userId: user.id,
          videoId: video.id,
          likes: 32,
        },
        {
          content: 'Could you please make a video about microservices architecture?',
          userId: admin.id,
          videoId: video.id,
          likes: 15,
        },
      ];

      for (const commentData of comments) {
        await prisma.comment.create({
          data: commentData,
        });
      }

      // Add a reply
      const parentComment = await prisma.comment.findFirst({
        where: { videoId: video.id, parentId: null },
      });

      if (parentComment) {
        await prisma.comment.create({
          data: {
            content: 'Great question! I\'ll cover microservices in the next video.',
            userId: user.id,
            videoId: video.id,
            parentId: parentComment.id,
            likes: 10,
          },
        });
      }
    }

    // Create sample notifications
    console.log('Creating sample notifications...');
    if (admin) {
      await prisma.notification.createMany({
        data: [
          {
            userId: admin.id,
            type: 'SUBSCRIPTION',
            title: 'New subscriber!',
            body: 'tech_tutorials subscribed to your channel.',
            isRead: false,
          },
          {
            userId: admin.id,
            type: 'COMMENT',
            title: 'New comment on your video',
            body: 'tech_tutorials commented: "Great video!"',
            isRead: false,
          },
          {
            userId: admin.id,
            type: 'LIKE',
            title: 'Video received a like!',
            body: 'tech_tutorials liked your video "Building a YouTube Clone"',
            isRead: false,
          },
        ],
      });
    }

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📊 Seed summary:');
    console.log(`   ✅ Admin user: admin@youtube-clone.com / Admin@123`);
    console.log(`   ✅ Creator user: creator@example.com / Creator@123`);
    console.log(`   ✅ 3 sample videos created`);
    console.log(`   ✅ Sample comments created`);
    console.log(`   ✅ Sample notifications created`);
    console.log('\n✨ You can now login with these credentials!');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
