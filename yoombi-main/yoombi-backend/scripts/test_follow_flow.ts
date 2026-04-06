import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testFollowFlow() {
  console.log('--- Starting Follow Flow Test ---');

  try {
    // 1. Find a test user and a test restaurant
    const user = await prisma.user.findFirst();
    const restaurant = await prisma.restaurant.findFirst();

    if (!user || !restaurant) {
      console.error('Test user or restaurant not found. Please seed the database first.');
      process.exit(1);
    }

    console.log(`Testing with User: ${user.name} (${user.id})`);
    console.log(`Testing with Restaurant: ${restaurant.name} (${restaurant.id})`);

    // 2. Clear existing follows for this pair (cleanup)
    await prisma.follow.deleteMany({
      where: { userId: user.id, restaurantId: restaurant.id }
    });

    const initialPoints = user.loyaltyPoints;
    console.log(`Initial Loyalty Points: ${initialPoints}`);

    // 3. Simulate Follow (Logic from restaurant.ts)
    console.log('Following restaurant...');
    await prisma.$transaction([
      prisma.follow.create({
        data: { userId: user.id, restaurantId: restaurant.id }
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { loyaltyPoints: { increment: 5 } }
      })
    ]);

    // 4. Verify
    const updatedUser = await prisma.user.findUnique({ where: { id: user.id } });
    const followCount = await prisma.follow.count({ where: { userId: user.id, restaurantId: restaurant.id } });

    console.log(`Updated Loyalty Points: ${updatedUser?.loyaltyPoints}`);
    console.log(`Follow Entry Found: ${followCount === 1 ? 'YES' : 'NO'}`);

    if (updatedUser?.loyaltyPoints === initialPoints + 5 && followCount === 1) {
      console.log('✅ Follow Flow Test Passed!');
    } else {
      console.error('❌ Follow Flow Test Failed!');
    }

    // 5. Simulate Fetch Profile (Logic from auth.ts)
    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        following: true
      }
    });
    const followingIds = profile?.following.map(f => f.restaurantId);
    console.log(`User now following: [${followingIds?.join(', ')}]`);
    
    if (followingIds?.includes(restaurant.id)) {
      console.log('✅ Profile Fetch Logic Passed!');
    } else {
      console.error('❌ Profile Fetch Logic Failed!');
    }

    // 6. Cleanup
    await prisma.follow.deleteMany({
      where: { userId: user.id, restaurantId: restaurant.id }
    });
    await prisma.user.update({
      where: { id: user.id },
      data: { loyaltyPoints: initialPoints }
    });
    console.log('Cleanup complete.');

  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testFollowFlow();
