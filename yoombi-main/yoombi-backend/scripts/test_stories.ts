import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testStories() {
    try {
        console.log('--- Testing Stories Prisma Models ---');
        
        // Find a restaurant to attach a story to
        const restaurant = await prisma.restaurant.findFirst();
        if (!restaurant) {
            console.log('No restaurant found to test with.');
            return;
        }

        console.log(`Using restaurant: ${restaurant.name} (${restaurant.id})`);

        // Use any to bypass lint for now if it persists
        const story = await (prisma as any).story.create({
            data: {
                restaurantId: restaurant.id,
                items: {
                    create: [
                        { type: 'IMAGE', url: 'https://images.unsplash.com/photo-1517248135467-4c7ed9d421bb', text: 'Beautiful ambiance' },
                        { type: 'TEXT', text: 'Join us tonight for live jazz!' }
                    ]
                }
            },
            include: { items: true }
        });

        console.log('✅ Story created successfully:', story.id);
        console.log('Items count:', story.items.length);

        const allStories = await (prisma as any).story.findMany({
            include: { restaurant: true, items: true }
        });
        console.log('✅ Fetch all stories count:', allStories.length);

        // Cleanup
        await (prisma as any).story.delete({ where: { id: story.id } });
        console.log('✅ Cleanup complete.');

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testStories();
