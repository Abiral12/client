
export interface Product {
    _id: string;
    sku: string;
    category: string;
    subcategory: string;
    size?: string;
    color: string;
    quantity: number;
    purchasePrice: number;
    sellingPrice: number;
    qrCode?: string;
    createdAt?: string;
    lastUpdated?: string;
    soldCount?: number;
  }