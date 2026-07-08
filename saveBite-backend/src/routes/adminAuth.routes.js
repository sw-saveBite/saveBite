import { Router } from "express";

import { checkAdminEmail, loginAdmin, signupAdmin } from "../controllers/adminAuth.controller.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.post("/check-email", asyncHandler(checkAdminEmail));
router.post("/signup", asyncHandler(signupAdmin));
router.post("/login", asyncHandler(loginAdmin));

export default router;
