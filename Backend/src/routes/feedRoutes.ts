//DELETE LATER

// routes/feedRoutes.ts
import express from "express";
import { addUserSourceController } from "../controllers/controller";

const router = express.Router();

router.post("/user/:userId/source", addUserSourceController);

export default router;
