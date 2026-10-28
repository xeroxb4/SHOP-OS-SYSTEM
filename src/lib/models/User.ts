import mongoose, { Schema, Document, Model } from "mongoose";

export type UserRole = "admin" | "warehouse" | "shop" | "viewer";

export interface IUser extends Document {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    fullName: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: ["admin", "warehouse", "shop", "viewer"],
      default: "shop",
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
