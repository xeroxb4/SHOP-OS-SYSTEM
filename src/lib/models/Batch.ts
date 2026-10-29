import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type ExpiryStatus = "OK" | "EXPIRING_WITHIN_90_DAYS" | "EXPIRING_WITHIN_30_DAYS" | "EXPIRED";

export interface IBatch extends Document {
  productId: Types.ObjectId;
  batchNumber?: string;
  quantity: number;
  location: "warehouse" | "shop";
  manufactureDate?: Date;
  expiryDate?: Date; // optional: non-perishable goods have none
  costPrice: number;
  createdAt: Date;
  updatedAt: Date;
}

const BatchSchema = new Schema<IBatch>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    batchNumber: { type: String, trim: true },
    quantity: { type: Number, required: true, min: 0 },
    location: { type: String, enum: ["warehouse", "shop"], required: true },
    manufactureDate: { type: Date },
    expiryDate: { type: Date },
    costPrice: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

BatchSchema.index({ productId: 1, location: 1 });
BatchSchema.index({ expiryDate: 1 });

export const Batch: Model<IBatch> =
  mongoose.models.Batch || mongoose.model<IBatch>("Batch", BatchSchema);
