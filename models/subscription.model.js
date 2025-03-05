import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    name: {
      type: string,
      required: [true, "Subscription name is required"],
      trim: true,
      minLength: 2,
      maxLength: 50,
    },
    price: {
      type: number,
      required: [true, "Subscription price is required"],
      min: [0, "Subscription price must be greater tha 0"],
    },
    currency: {
      type: string,
      enum: ["USD", "INR", "EUR"],
      default: "USD",
    },
    frequency: {
      type: string,
      enum: ["daily", "weekly", "monthly", "yearly"],
    },
    category: {
      type: string,
      enum: [
        "sports",
        "news",
        "entertainment",
        "lifestyle",
        "technology",
        "finance",
        "poilitics",
        "other",
      ],
      requiredL: true,
    },
    paymentMethod: {
      type: string,
      required: true,
      trim: true,
    },
    status: {
      type: string,
      enum: ["active", "cancelled", "expired"],
      default: "active",
    },
    startDate: {
      type: Date,
      required: true,
      validate: {
        validator: (value) => value <= new Date(),
        message: "Start date must be in the past",
      },
    },
    renewalDate: {
      type: Date,
      required: true,
      validate: {
        validator: function (value) {
          return value > this.startDate;
        },
        message: "Renewal date must be after the start date",
      },
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timeStamps: true }
);

// autocalculate the renewal date if its not provided
subscriptionSchema.pre("save", function (next) {
  if (!this.renewalDate) {
    const renewalPeriods = {
      daily: 1,
      weekly: 7,
      monthly: 30,
      yearly: 365,
    };
    // jan 1st
    // monthly
    // 30 days
    // jan 31st
    this.renewalDate = new Date(this.startDate);
    this.renewalDate.setDate(
      this.renewalDate.getDate() + renewalPeriods[this.frequency]
    );
  }
  // AUTO UPDATE THE STATUS IF RENEWAL DATE HAS PASSED
  if (this.renewalDate < new Date()) {
    this.status = "expired";
  }
  next();
});
export const Subscription = mongoose.model("Subscription", subscriptionSchema);
