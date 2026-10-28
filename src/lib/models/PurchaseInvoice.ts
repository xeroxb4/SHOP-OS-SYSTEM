import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IPurchaseInvoiceItem {
  productId: Types.ObjectId;
  quantity: number;
  costPrice: number;
  batchNumber?: string;
  expiryDate?: Date;
}

export interface IPurchaseInvoice extends Document {
  invoiceNumber: string;
  supplierId: Types.ObjectId;
  invoiceDate: Date;
  enteredBy: Types.ObjectId;
  items: IPurchaseInvoiceItem[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PurchaseInvoiceItemSchema = new Schema<IPurchaseInvoiceItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 1 },
    costPrice: { type: Number, required: true, min: 0 },
    batchNumber: { type: String, trim: true },
    expiryDate: { type: Date },
  },
  { _id: false }
);

const PurchaseInvoiceSchema = new Schema<IPurchaseInvoice>(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    supplierId: { type: Schema.Types.ObjectId, ref: "Supplier", required: true },
    invoiceDate: { type: Date, required: true },
    enteredBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    items: { type: [PurchaseInvoiceItemSchema], required: true },
    notes: { type: String },
  },
  { timestamps: true }
);

export const PurchaseInvoice: Model<IPurchaseInvoice> =
  mongoose.models.PurchaseInvoice ||
  mongoose.model<IPurchaseInvoice>("PurchaseInvoice", PurchaseInvoiceSchema);
