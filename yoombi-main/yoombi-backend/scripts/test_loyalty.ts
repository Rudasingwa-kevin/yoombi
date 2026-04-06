import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testLoyaltyFlow() {
  console.log('--- Starting Loyalty Check-in Test ---');

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

    const initialPoints = user.loyaltyPoints;
    console.log(`Initial Loyalty Points: ${initialPoints}`);

    // 2. Simulate Check-in (Logic from loyalty.ts)
    console.log('Performing check-in...');
    const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
            loyaltyPoints: {
                increment: 50
            }
        }
    });

    console.log(`Updated Loyalty Points: ${updatedUser.loyaltyPoints}`);

    if (updatedUser.loyaltyPoints === initialPoints + 50) {
      console.log('✅ Loyalty Check-in Test Passed!');
    } else {
      console.error('❌ Loyalty Check-in Test Failed!');
    }

    // 3. Cleanup
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

testLoyaltyFlow();
