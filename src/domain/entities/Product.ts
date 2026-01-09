/**
 * Product Entity
 * Single Responsibility: Defines the product data structure
 */

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  priceWholesale?: number;
  minWholesaleQty?: number;
  category: string;
  images: string[];
  inStock: boolean;
  quantity: number;
  colors: string[];
  sizes: string[];
  publishedOnWebsite?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ProductCategory = string;

export interface CategoryDefinition {
  value: string;
  labelKey: string;
  emoji: string;
}

export interface CustomCategory {
  value: string;
  emoji: string;
}

export const DEFAULT_CATEGORIES: CategoryDefinition[] = [
  { value: 'djellaba', labelKey: 'categories.djellaba', emoji: '👗' },
  { value: 'caftan', labelKey: 'categories.caftan', emoji: '👘' },
  { value: 'abaya', labelKey: 'categories.abaya', emoji: '🧥' },
  { value: 'takchita', labelKey: 'categories.takchita', emoji: '✨' },
  { value: 'accessories', labelKey: 'categories.accessories', emoji: '💍' },
  { value: 'other', labelKey: 'categories.other', emoji: '🛍️' },
];
