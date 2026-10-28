import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type SaleType = "retail" | "wholesale";

export interface ISaleItem {
  productId: Types.ObjectId;
  quantity: number;
  unitPrice: number;
  costPrice: number;
}

export interface ISale extends Document {
  saleNumber: string;
  saleDate: Date;
  saleType: SaleType;
  servedBy: Types.ObjectId;
  items: ISaleItem[];
  customerName?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SaleItemSchema = new Schema<ISaleItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    costPrice: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const SaleSchema = new Schema<ISale>(
  {
    saleNumber: { type: String, required: true, unique: true },
    saleDate: { type: Date, required: true },
    saleType: { type: String, enum: ["retail", "wholesale"], required: true },
    servedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    items: { type: [SaleItemSchema], required: true },
    customerName: { type: String, trim: true },
    notes: { type: String },
  },
  { timestamps: true }
);

export const Sale: Model<ISale> =
  mongoose.models.Sale || mongoose.model<ISale>("Sale", SaleSchema);
