import { Subscription } from "../models/subscription.model.js";

export const createSubscription = async(req,res,next) => {
    try {
        const subscription = await Subscription.create({
            ...req.body,
            user:req.user._id,
        });
        res.status(201).json({ success:true, data : subscription})
    } catch (error) {
        next(error);
    }
}



export const getUserSubscription = async(req,res,next) => {
    try {
        // check if the user is the same as the one in the token
        if(req.user.id !== req.params.id){
            const error = new ERROR("You are not the owner if this account");
            error.statusCode = 401;
            throw error;
        }
        const subscription = await Subscription.find({user : req.params.id});
        res.status(200).json({success:true , data : subscription});
    } catch (error) {
        next(error);
    }
}