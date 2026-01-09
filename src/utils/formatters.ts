/**
 * Formatting Utilities
 * Single Responsibility: Data formatting functions
 */

export const formatPrice = (price: number, currency = 'DA'): string => {
  return price.toLocaleString('fr-DZ') + ' ' + currency;
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-DZ', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-DZ', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatQuantity = (quantity: number, unit = 'units'): string => {
  return `${quantity} ${unit}`;
};
