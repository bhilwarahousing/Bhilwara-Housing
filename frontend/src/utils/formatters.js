/**
 * Format Indian Rupee currency with Lac / Crore abbreviations
 */
export function formatPrice(price, listingType = 'Buy') {
  if (price === null || price === undefined) return 'Price on Request';
  
  if (listingType === 'Rent') {
    return `₹${price.toLocaleString('en-IN')}/mo`;
  }

  if (price >= 10000000) {
    const cr = price / 10000000;
    return `₹${cr % 1 === 0 ? cr.toFixed(0) : cr.toFixed(2)} Cr`;
  }
  if (price >= 100000) {
    const lakh = price / 100000;
    return `₹${lakh % 1 === 0 ? lakh.toFixed(0) : lakh.toFixed(2)} Lakh`;
  }
  return `₹${price.toLocaleString('en-IN')}`;
}

export function formatArea(sqft) {
  if (!sqft) return '';
  return `${sqft.toLocaleString('en-IN')} sq.ft`;
}
