import { Router } from "express";
import { authorize } from "../middlewares/auth.middleware.js";
import {
  cancelSubscription,
  createSubscription,
  getUserSubscription,
  updateSubscription,
} from "../controllers/subscription.controller.js";

const subscriptionRouter = Router();

subscriptionRouter.post("/", authorize, createSubscription);
subscriptionRouter.put("/:id", authorize, updateSubscription);
subscriptionRouter.delete("/:id", (req, res) =>
  res.send({ title: "DELETE the subscription" })
);
subscriptionRouter.get("/user/:id", authorize, getUserSubscription);
subscriptionRouter.put("/:id/cancel", authorize, cancelSubscription);

export default subscriptionRouter;
