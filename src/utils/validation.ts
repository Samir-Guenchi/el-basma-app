/**
 * Validation Utilities
 * Single Responsibility: Input validation functions
 */

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

export const isValidPrice = (price: number): boolean => {
  return price >= 0 && Number.isFinite(price);
};

export const isValidQuantity = (quantity: number): boolean => {
  return quantity >= 0 && Number.isInteger(quantity);
};

export const isNotEmpty = (value: string): boolean => {
  return value.trim().length > 0;
};

export const isValidProductName = (name: string): boolean => {
  return name.trim().length >= 2 && name.trim().length <= 100;
};
