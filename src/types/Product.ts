// types/product.ts
export interface Product {
  id: number;
  description: string;
  image_url: string;
  quantity: number;
  suggested_quantity: number;
  price: number;
  price_usd: number;
  status: 'green' | 'yellow' | 'red';
  categories: string[];
  owner: string;
}


