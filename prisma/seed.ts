import { PrismaClient } from "@prisma/client";
import { seedOptions } from "../src/data/seed-options";
import { DATASET_VERSION } from "../src/lib/version";

const prisma = new PrismaClient();

async function main() {
  for (const option of seedOptions) {
    await prisma.referenceOption.upsert({
      where: { canonicalOptionId: option.canonicalOptionId },
      update: { college: option.college, branch: option.branch, data: option, datasetVersion: DATASET_VERSION },
      create: {
        id: option.canonicalOptionId,
        canonicalOptionId: option.canonicalOptionId,
        college: option.college,
        branch: option.branch,
        data: option,
        datasetVersion: DATASET_VERSION
      }
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
