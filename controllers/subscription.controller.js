import { SERVER_URL } from "../config/env.js";
import { workflowClient } from "../config/upstash.js";
import { Subscription } from "../models/subscription.model.js";

export const createSubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.create({
      ...req.body,
      user: req.user._id,
    });
    const { workflowRunId } = await workflowClient.trigger({
      url: `${SERVER_URL}/api/v1/workflows/subscription/reminder`,
      body: {
        subscriptionId: subscription.id,
      },
      headers: {
        "content-type": "application/json",
      },
      retries: 0,
    });
    res
      .status(201)
      .json({ success: true, data: { subscription, workflowRunId } });
  } catch (error) {
    next(error);
  }
};

export const getUserSubscription = async (req, res, next) => {
  try {
    // check if the user is the same as the one in the token
    if (req.user.id !== req.params.id) {
      const error = new ERROR("You are not the owner if this account");
      error.statusCode = 401;
      throw error;
    }
    const subscription = await Subscription.find({ user: req.params.id });
    res.status(200).json({ success: true, data: subscription });
  } catch (error) {
    next(error);
  }
};

export const updateSubscription = async (req, res, next) => {
  try {
    // Find the subscription by ID and ensure it belongs to the logged-in user
    const subscription = await Subscription.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!subscription) {
      const error = new Error(
        "Subscription not found or you are not authorized to update it"
      );
      error.statusCode = 404;
      throw error;
    }

    // Update the subscription with the provided data
    Object.assign(subscription, req.body);
    await subscription.save();

    res.status(200).json({
      success: true,
      message: "Subscription updated successfully",
      data: subscription,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteSubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!subscription) {
      const error = new Error(
        "Subscription not found or you are not authorized to delete it"
      );
      error.statusCode = 404;
      throw error;
    }
    res
      .status(200)
      .json({ success: true, message: "Subscription deleted successfully" });
  } catch (error) {
    next(error);
  }
};


export const cancelSubscription = async(req,res,nest) => {
  try {
    const subscription = await Subscription.findOne({
      _id : req.params.id,
      user : req.user._id
    });
    if(!subscription){
      const error = new Error("Subscription not found or you are not authorized to cancel it");
      error.statusCode = 404;
      throw error;
    }
    subscription.status = "cancelled";
    await subscription.save();
    res.status(200).json({success:true,message:"Subscription cancelled successfully"});
  } catch (error) {
    next(error);
  }
}