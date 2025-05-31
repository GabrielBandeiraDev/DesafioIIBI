export function getStockStatusColor(quantity: number, suggested: number): 'red' | 'yellow' | 'green' {
  if (quantity < suggested) return 'red';
  if (suggested - quantity <= 5) return 'yellow';
  return 'green';
}
