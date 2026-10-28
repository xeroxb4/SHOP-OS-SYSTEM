import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IStockTransferItem {
  productId: Types.ObjectId;
  quantity: number;
}

export interface IStockTransfer extends Document {
  transferNumber: string;
  transferDate: Date;
  issuedBy: Types.ObjectId;
  items: IStockTransferItem[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const StockTransferItemSchema = new Schema<IStockTransferItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const StockTransferSchema = new Schema<IStockTransfer>(
  {
    transferNumber: { type: String, required: true, unique: true },
    transferDate: { type: Date, required: true },
    issuedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    items: { type: [StockTransferItemSchema], required: true },
    notes: { type: String },
  },
  { timestamps: true }
);

export const StockTransfer: Model<IStockTransfer> =
  mongoose.models.StockTransfer ||
  mongoose.model<IStockTransfer>("StockTransfer", StockTransferSchema);
