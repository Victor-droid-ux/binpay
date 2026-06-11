import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import { connectDatabase } from "./config/database";

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from "./routes/auth";
import billRoutes from "./routes/bills";
import paymentRoutes from "./routes/payments";
import adminRoutes from "./routes/admin";
import infoRoutes from "./routes/info";

const app: Application = express();
const PORT = process.env.PORT || 5000;
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
const allowedOriginsSet = new Set<string>([frontendUrl]);

try {
  const parsedUrl = new URL(frontendUrl);
  if (parsedUrl.hostname.startsWith("www.")) {
    allowedOriginsSet.add(
      `${parsedUrl.protocol}//${parsedUrl.hostname.replace(/^www\./, "")}`,
    );
  } else {
    allowedOriginsSet.add(`${parsedUrl.protocol}//www.${parsedUrl.hostname}`);
  }
} catch {
  // Keep only configured value if URL parsing fails.
}

if (process.env.NODE_ENV !== "production") {
  allowedOriginsSet.add("http://localhost:3000");
}

const allowedOrigins = Array.from(allowedOriginsSet);

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/bills", billRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/info", infoRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: "Route not found",
    code: "ROUTE_NOT_FOUND",
    severity: "warning",
    dismissAfterMs: 6000,
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Error:", err);
  res.status(500).json({
    error: "Internal server error",
    code: "INTERNAL_SERVER_ERROR",
    severity: "error",
    dismissAfterMs: 8000,
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDatabase();

    app.listen(PORT, () => {
      console.log(`
🚀 Bin-Pay Backend Server Started
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📡 Server:       http://localhost:${PORT}
🌍 Environment:  ${process.env.NODE_ENV || "development"}
📊 API Docs:     http://localhost:${PORT}/health
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

export default app;
