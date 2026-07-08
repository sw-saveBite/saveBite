import { Router } from "express";

import { checkUserEmail, loginUser, signupUser } from "../controllers/userAuth.controller.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.post("/check-email", asyncHandler(checkUserEmail));
router.post("/signup", asyncHandler(signupUser));
router.post("/login", asyncHandler(loginUser));

export default router;
