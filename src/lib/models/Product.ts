import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IProduct extends Document {
  categoryId: Types.ObjectId;
  variant: string;
  sku?: string;
  costPrice: number;
  wholesalePrice: number;
  retailPrice: number;
  reorderLevel: number;
  warehouseQty: number;
  shopQty: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    variant: { type: String, required: true, trim: true },
    sku: { type: String, trim: true, sparse: true },
    costPrice: { type: Number, required: true, min: 0, default: 0 },
    wholesalePrice: { type: Number, required: true, min: 0, default: 0 },
    retailPrice: { type: Number, required: true, min: 0, default: 0 },
    reorderLevel: { type: Number, default: 5, min: 0 },
    warehouseQty: { type: Number, default: 0, min: 0 },
    shopQty: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ProductSchema.index({ categoryId: 1, variant: 1 }, { unique: true });

export const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);
