import { Router } from "express";
import asyncHandler from "express-async-handler";
import { z } from "zod";
import { prisma } from "../prisma";
import { Prisma } from "@prisma/client";
import { requireAuth, requireRole, AuthedRequest } from "../middleware/auth";
import { ApiError } from "../middleware/errorHandler";

const router = Router();
router.use(requireAuth);

const challanCreateSchema = z.object({
  customerId: z.string().min(1),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().positive(),
      })
    )
    .min(1),
  status: z.enum(["DRAFT", "CONFIRMED"]).default("DRAFT"),
});

async function generateChallanNumber(tx: Prisma.TransactionClient): Promise<string> {
  const year = new Date().getFullYear();
  const count = await tx.challan.count({ where: { challanNumber: { startsWith: `CH-${year}-` } } });
  const next = String(count + 1).padStart(4, "0");
  return `CH-${year}-${next}`;
}

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const status = req.query.status as string | undefined;
    const page = Math.max(parseInt((req.query.page as string) || "1"), 1);
    const pageSize = Math.min(parseInt((req.query.pageSize as string) || "20"), 100);

    const where: any = status ? { status } : {};

    const [items, total] = await Promise.all([
      prisma.challan.findMany({
        where,
        include: { customer: { select: { name: true, businessName: true } }, items: true },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.challan.count({ where }),
    ]);

    res.json({ items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const challan = await prisma.challan.findUnique({
      where: { id: req.params.id },
      include: { customer: true, items: { include: { product: { select: { name: true, sku: true } } } }, createdBy: { select: { name: true } } },
    });
    if (!challan) throw new ApiError(404, "Challan not found");
    res.json(challan);
  })
);

// Create a challan. If status=CONFIRMED, stock is validated and reduced
// atomically. If status=DRAFT, stock is untouched.
router.post(
  "/",
  requireRole("ADMIN", "SALES"),
  asyncHandler(async (req: AuthedRequest, res) => {
    const data = challanCreateSchema.parse(req.body);

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const customer = await tx.customer.findUnique({ where: { id: data.customerId } });
      if (!customer) throw new ApiError(404, "Customer not found");

      const products = await tx.product.findMany({
        where: { id: { in: data.items.map((i) => i.productId) } },
      });
      const productMap = new Map(products.map((p) => [p.id, p]));

      // Validate every line item exists and, if confirming, has enough stock.
      for (const item of data.items) {
        const product = productMap.get(item.productId);
        if (!product) throw new ApiError(404, `Product ${item.productId} not found`);
        if (data.status === "CONFIRMED" && product.stock < item.quantity) {
          throw new ApiError(
            400,
            `Insufficient stock for "${product.name}" (SKU ${product.sku}). Available: ${product.stock}, requested: ${item.quantity}`
          );
        }
      }

      const challanNumber = await generateChallanNumber(tx);
      const totalQuantity = data.items.reduce((sum, i) => sum + i.quantity, 0);

      const challan = await tx.challan.create({
        data: {
          challanNumber,
          customerId: data.customerId,
          status: data.status,
          totalQuantity,
          createdById: req.user!.id,
          items: {
            create: data.items.map((item) => {
              const product = productMap.get(item.productId)!;
              return {
                productId: item.productId,
                quantity: item.quantity,
                productNameSnapshot: product.name,
                skuSnapshot: product.sku,
                unitPriceSnapshot: product.unitPrice,
              };
            }),
          },
        },
        include: { items: true },
      });

      // Only reduce stock + log movement when confirmed.
      if (data.status === "CONFIRMED") {
        for (const item of data.items) {
          const product = productMap.get(item.productId)!;
          await tx.product.update({
            where: { id: product.id },
            data: { stock: product.stock - item.quantity },
          });
          await tx.stockMovement.create({
            data: {
              productId: product.id,
              quantity: item.quantity,
              type: "OUT",
              reason: `Challan ${challanNumber} confirmed`,
              createdById: req.user!.id,
            },
          });
        }
      }

      return challan;
    });

    res.status(201).json(result);
  })
);

// Confirm a draft challan — re-validates stock at confirmation time.
router.post(
  "/:id/confirm",
  requireRole("ADMIN", "SALES"),
  asyncHandler(async (req: AuthedRequest, res) => {
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const challan = await tx.challan.findUnique({ where: { id: req.params.id }, include: { items: true } });
      if (!challan) throw new ApiError(404, "Challan not found");
      if (challan.status !== "DRAFT") throw new ApiError(400, `Only DRAFT challans can be confirmed (current status: ${challan.status})`);

      for (const item of challan.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) throw new ApiError(404, `Product ${item.productId} no longer exists`);
        if (product.stock < item.quantity) {
          throw new ApiError(400, `Insufficient stock for "${product.name}". Available: ${product.stock}, requested: ${item.quantity}`);
        }
      }

      for (const item of challan.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        await tx.product.update({ where: { id: item.productId }, data: { stock: product!.stock - item.quantity } });
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            quantity: item.quantity,
            type: "OUT",
            reason: `Challan ${challan.challanNumber} confirmed`,
            createdById: req.user!.id,
          },
        });
      }

      return tx.challan.update({ where: { id: challan.id }, data: { status: "CONFIRMED" }, include: { items: true } });
    });

    res.json(result);
  })
);

router.post(
  "/:id/cancel",
  requireRole("ADMIN", "SALES"),
  asyncHandler(async (req: AuthedRequest, res) => {
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const challan = await tx.challan.findUnique({ where: { id: req.params.id }, include: { items: true } });
      if (!challan) throw new ApiError(404, "Challan not found");
      if (challan.status === "CANCELLED") throw new ApiError(400, "Challan is already cancelled");

      // If it was confirmed, restock the items since goods are no longer going out.
      if (challan.status === "CONFIRMED") {
        for (const item of challan.items) {
          const product = await tx.product.findUnique({ where: { id: item.productId } });
          if (product) {
            await tx.product.update({ where: { id: item.productId }, data: { stock: product.stock + item.quantity } });
            await tx.stockMovement.create({
              data: {
                productId: item.productId,
                quantity: item.quantity,
                type: "IN",
                reason: `Challan ${challan.challanNumber} cancelled — stock reversed`,
                createdById: req.user!.id,
              },
            });
          }
        }
      }

      return tx.challan.update({ where: { id: challan.id }, data: { status: "CANCELLED" } });
    });

    res.json(result);
  })
);

export default router;
