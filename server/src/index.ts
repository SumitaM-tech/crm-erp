import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth";
import customerRoutes from "./routes/customers";
import productRoutes from "./routes/products";
import challanRoutes from "./routes/challans";
import { errorHandler, notFound } from "./middleware/errorHandler";

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || "*" }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/auth", authRoutes);
app.use("/customers", customerRoutes);
app.use("/products", productRoutes);
app.use("/challans", challanRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
