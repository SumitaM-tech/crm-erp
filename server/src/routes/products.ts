import { Router } from "express";
import asyncHandler from "express-async-handler";
import { z } from "zod";
import { prisma } from "../prisma";
import { Prisma } from "@prisma/client";
import { requireAuth, requireRole, AuthedRequest } from "../middleware/auth";
import { ApiError } from "../middleware/errorHandler";

const router = Router();
router.use(requireAuth);

const productSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  category: z.string().optional().nullable(),
  unitPrice: z.number().positive(),
  minStock: z.number().int().min(0).default(0),
  location: z.string().optional().nullable(),
});

const stockMoveSchema = z.object({
  quantity: z.number().int().positive(),
  type: z.enum(["IN", "OUT"]),
  reason: z.string().min(1),
});

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const search = (req.query.search as string) || "";
    const lowStock = req.query.lowStock === "true";
    const page = Math.max(parseInt((req.query.page as string) || "1"), 1);
    const pageSize = Math.min(parseInt((req.query.pageSize as string) || "20"), 100);

    const where: any = {
      AND: [
        search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { sku: { contains: search, mode: "insensitive" } },
              ],
            }
          : {},
      ],
    };

    const allItems = await prisma.product.findMany({ where, orderBy: { createdAt: "desc" } });
    const filtered = lowStock ? allItems.filter((p) => p.stock <= p.minStock) : allItems;
    const total = filtered.length;
    const items = filtered.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);

    res.json({ items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { stockMovements: { orderBy: { createdAt: "desc" }, take: 50, include: { createdBy: { select: { name: true } } } } },
    });
    if (!product) throw new ApiError(404, "Product not found");
    res.json(product);
  })
);

router.post(
  "/",
  requireRole("ADMIN", "WAREHOUSE"),
  asyncHandler(async (req, res) => {
    const data = productSchema.parse(req.body);
    const existing = await prisma.product.findUnique({ where: { sku: data.sku } });
    if (existing) throw new ApiError(409, "A product with this SKU already exists");

    const product = await prisma.product.create({ data: { ...data, stock: 0 } });
    res.status(201).json(product);
  })
);

router.put(
  "/:id",
  requireRole("ADMIN", "WAREHOUSE"),
  asyncHandler(async (req, res) => {
    const data = productSchema.partial().parse(req.body);
    const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new ApiError(404, "Product not found");

    const product = await prisma.product.update({ where: { id: req.params.id }, data });
    res.json(product);
  })
);

// Stock movement — the only sanctioned way to change `stock`.
router.post(
  "/:id/stock-movements",
  requireRole("ADMIN", "WAREHOUSE"),
  asyncHandler(async (req: AuthedRequest, res) => {
    const { quantity, type, reason } = stockMoveSchema.parse(req.body);

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const product = await tx.product.findUnique({ where: { id: req.params.id } });
      if (!product) throw new ApiError(404, "Product not found");

      const newStock = type === "IN" ? product.stock + quantity : product.stock - quantity;
      if (newStock < 0) {
        throw new ApiError(400, `Insufficient stock. Current stock: ${product.stock}, requested OUT: ${quantity}`);
      }

      const updated = await tx.product.update({ where: { id: product.id }, data: { stock: newStock } });
      const movement = await tx.stockMovement.create({
        data: { productId: product.id, quantity, type, reason, createdById: req.user!.id },
      });

      return { product: updated, movement };
    });

    res.status(201).json(result);
  })
);

export default router;
