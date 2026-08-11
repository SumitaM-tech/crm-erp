import { Router } from "express";
import asyncHandler from "express-async-handler";
import { z } from "zod";
import { prisma } from "../prisma";
import { requireAuth, requireRole, AuthedRequest } from "../middleware/auth";
import { ApiError } from "../middleware/errorHandler";

const router = Router();
router.use(requireAuth);

const customerSchema = z.object({
  name: z.string().min(1),
  mobile: z.string().min(6),
  email: z.string().email().optional().nullable(),
  businessName: z.string().optional().nullable(),
  gstNumber: z.string().optional().nullable(),
  type: z.enum(["RETAIL", "WHOLESALE", "DISTRIBUTOR"]).default("RETAIL"),
  address: z.string().optional().nullable(),
  status: z.enum(["LEAD", "ACTIVE", "INACTIVE"]).default("LEAD"),
  followUpDate: z.string().datetime().optional().nullable(),
  notes: z.string().optional().nullable(),
});

// GET /customers?search=&status=&type=&page=&pageSize=
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const search = (req.query.search as string) || "";
    const status = req.query.status as string | undefined;
    const type = req.query.type as string | undefined;
    const page = Math.max(parseInt((req.query.page as string) || "1"), 1);
    const pageSize = Math.min(parseInt((req.query.pageSize as string) || "20"), 100);

    const where: any = {
      AND: [
        search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { mobile: { contains: search, mode: "insensitive" } },
                { businessName: { contains: search, mode: "insensitive" } },
              ],
            }
          : {},
        status ? { status } : {},
        type ? { type } : {},
      ],
    };

    const [items, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.customer.count({ where }),
    ]);

    res.json({ items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const customer = await prisma.customer.findUnique({
      where: { id: req.params.id },
      include: { followUps: { orderBy: { createdAt: "desc" }, include: { createdBy: { select: { name: true } } } } },
    });
    if (!customer) throw new ApiError(404, "Customer not found");
    res.json(customer);
  })
);

router.post(
  "/",
  requireRole("ADMIN", "SALES"),
  asyncHandler(async (req, res) => {
    const data = customerSchema.parse(req.body);
    const customer = await prisma.customer.create({
      data: { ...data, followUpDate: data.followUpDate ? new Date(data.followUpDate) : null },
    });
    res.status(201).json(customer);
  })
);

router.put(
  "/:id",
  requireRole("ADMIN", "SALES"),
  asyncHandler(async (req, res) => {
    const data = customerSchema.partial().parse(req.body);
    const existing = await prisma.customer.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new ApiError(404, "Customer not found");

    const customer = await prisma.customer.update({
      where: { id: req.params.id },
      data: { ...data, followUpDate: data.followUpDate ? new Date(data.followUpDate) : undefined },
    });
    res.json(customer);
  })
);

router.post(
  "/:id/follow-ups",
  requireRole("ADMIN", "SALES"),
  asyncHandler(async (req: AuthedRequest, res) => {
    const note = z.string().min(1).parse(req.body.note);
    const customer = await prisma.customer.findUnique({ where: { id: req.params.id } });
    if (!customer) throw new ApiError(404, "Customer not found");

    const followUp = await prisma.followUp.create({
      data: { customerId: customer.id, note, createdById: req.user!.id },
    });
    res.status(201).json(followUp);
  })
);

export default router;
