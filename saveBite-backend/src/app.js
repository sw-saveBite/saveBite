import cors from "cors";
import express from "express";
import morgan from "morgan";

import adminRoutes from "./routes/admin.routes.js";
import adminAuthRoutes from "./routes/adminAuth.routes.js";
import businessRoutes from "./routes/business.routes.js";
import directionsRoutes from "./routes/directions.routes.js";
import healthRoutes from "./routes/health.routes.js";
import userRoutes from "./routes/user.routes.js";
import userAuthRoutes from "./routes/userAuth.routes.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.json({
    message: "SaveBite API is running",
  });
});

app.use("/health", healthRoutes);
app.use("/api/auth/admin", adminAuthRoutes);
app.use("/api/auth/user", userAuthRoutes);
app.use("/api/public", businessRoutes);
app.use("/api", directionsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/user", userRoutes);

app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    message: err.message || "Internal server error",
  });
});

export default app;
