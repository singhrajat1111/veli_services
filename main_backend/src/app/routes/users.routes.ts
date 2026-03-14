import express from "express";

import { UserController } from "@/app/controllers/user.controller";

const userRouter = express.Router();

const userController = new UserController();

userRouter.route("/").get((req, res) => {
  // Handle fetching users logic here
  res.status(200).send("Fetched users successfully");
});

userRouter
  .route("/:id")
  .get((req, res) => {
    // Handle fetching a single user logic here
    res.status(200).send(`Fetched user with ID: ${req.params.id}`);
  })
  .put((req, res) => {
    // Handle updating a user logic here
    res.status(200).send(`Updated user with ID: ${req.params.id}`);
  })
  .delete((req, res) => {
    // Handle deleting a user logic here
    res.status(200).send(`Deleted user with ID: ${req.params.id}`);
  });

userRouter.route("/onboarding/:step").post(userController.onBoarding.bind(userController));

userRouter.route("/search").get((req, res) => {
  // Handle searching users logic here
  res.status(200).send("Searched users successfully");
});

userRouter.route("/stats").get((req, res) => {
  // Handle fetching user statistics logic here
  res.status(200).send("Fetched user statistics successfully");
});

export default userRouter;
