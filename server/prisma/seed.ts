import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const users: { name: string; email: string; role: Role }[] = [
    { name: "Admin User", email: "admin@erp.test", role: Role.ADMIN },
    { name: "Sales User", email: "sales@erp.test", role: Role.SALES },
    { name: "Warehouse User", email: "warehouse@erp.test", role: Role.WAREHOUSE },
    { name: "Accounts User", email: "accounts@erp.test", role: Role.ACCOUNTS },
  ];

  const passwordHash = await bcrypt.hash("Password@123", 10);

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, password: passwordHash },
    });
  }

  const admin = await prisma.user.findUniqueOrThrow({ where: { email: "admin@erp.test" } });

  const product1 = await prisma.product.upsert({
    where: { sku: "SKU-001" },
    update: {},
    create: {
      name: "Steel Rod 12mm",
      sku: "SKU-001",
      category: "Raw Material",
      unitPrice: 450.0,
      stock: 500,
      minStock: 50,
      location: "Warehouse A",
    },
  });

  const product2 = await prisma.product.upsert({
    where: { sku: "SKU-002" },
    update: {},
    create: {
      name: "Cement Bag 50kg",
      sku: "SKU-002",
      category: "Building Material",
      unitPrice: 380.0,
      stock: 200,
      minStock: 30,
      location: "Warehouse B",
    },
  });

  await prisma.stockMovement.createMany({
    data: [
      { productId: product1.id, quantity: 500, type: "IN", reason: "Initial stock", createdById: admin.id },
      { productId: product2.id, quantity: 200, type: "IN", reason: "Initial stock", createdById: admin.id },
    ],
  });

  await prisma.customer.upsert({
    where: { id: "seed-customer-1" },
    update: {},
    create: {
      id: "seed-customer-1",
      name: "Ravi Kumar",
      mobile: "9876543210",
      email: "ravi@example.com",
      businessName: "Kumar Traders",
      type: "WHOLESALE",
      status: "ACTIVE",
      address: "MG Road, Bengaluru",
      notes: "Regular bulk buyer",
    },
  });

  console.log("Seed complete. Test credentials (password for all: Password@123):");
  users.forEach((u) => console.log(`  ${u.role}: ${u.email}`));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
