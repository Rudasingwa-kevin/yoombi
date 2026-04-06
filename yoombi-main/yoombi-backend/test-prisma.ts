import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
console.log('User properties:', Object.keys(prisma.user));
console.log('Prisma keys:', Object.keys(prisma).filter(k => !k.startsWith('_')));
process.exit(0);
