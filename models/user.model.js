import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: string,
      required: [true, "User name is required"],
      trim: true,
      minLength: 2,
      maxLength: 50,
    },
    email: {
      type: string,
      required: [true, "User email is required"],
      trim: true,
      minLength: 2,
      unique: true,
      lowercase: true,
      maxLength: 50,
      match: [/\S+@\S+\.\S+/, "Please fill a valid email address"],
    },
    password: {
      type: string,
      required: [true, "User password is required"],
      minLength: 6,
    },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
