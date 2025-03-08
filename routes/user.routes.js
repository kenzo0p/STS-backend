import { Router } from "express";
import { getUser, getUsers } from "../controllers/user.controller.js";
import { authorize } from "../middlewares/auth.middleware.js";

const userRouter = Router();

userRouter.get("/",getUsers);
userRouter.get("/:id",authorize ,getUser);
userRouter.post("/", (req, res) => res.send({ title: "CREATE a User router" }));
userRouter.put("/:id", (req, res) => res.send({ title: "UPDATE the User" }));
userRouter.delete("/", (req, res) => res.send({ title: "User router" }));
userRouter.get("/:id", (req, res) => res.send({ title: "DELETE a User" }));

export default userRouter;
