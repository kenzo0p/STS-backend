import { Router } from "express";

const userRouter = Router();

userRouter.get("/", (req, res) => res.send({ title: "GET all users" }));
userRouter.get("/:id", (req, res) => res.send({ title: "GET user details" }));
userRouter.post("/", (req, res) => res.send({ title: "CREATE a User router" }));
userRouter.put("/:id", (req, res) => res.send({ title: "UPDATE the User" }));
userRouter.delete("/", (req, res) => res.send({ title: "User router" }));
userRouter.get("/:id", (req, res) => res.send({ title: "DELETE a User" }));

export default userRouter;
