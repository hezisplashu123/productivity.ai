import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  await prisma.questionPrompt.deleteMany({});
  console.log('Wiped QuestionPrompt');
}
main().finally(() => prisma.$disconnect());
