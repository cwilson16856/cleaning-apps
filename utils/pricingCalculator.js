const ServiceItem = require('../models/serviceItem');

const calculateItemizedPrice = async (serviceItems, taxRateInput) => {
  let subtotal = 0;
  let breakdown = [];

  for (const item of serviceItems) {
    try {
      const serviceItem = await ServiceItem.findById(item.serviceItemId);
      if (!serviceItem) throw new Error(`Service item not found with ID: ${item.serviceItemId}`);
      
      const price = item.customPrice !== undefined ? item.customPrice : serviceItem.price;
      const itemTotal = price * item.quantity;
      subtotal += itemTotal;

      breakdown.push({
        name: serviceItem.name,
        quantity: item.quantity,
        price: price,
        total: itemTotal
      });
    } catch (error) {
      console.error(`Error calculating itemized price: ${error.message}`, error);
      throw error;
    }
  }

  const taxRate = taxRateInput || 0; // Allow tax rate to be dynamically input, defaulting to 0 if not provided
  const taxAmount = subtotal * taxRate;
  const totalPrice = subtotal + taxAmount;

  return { subtotal, taxAmount, totalPrice, breakdown };
};

const calculateBundledPrice = async (serviceItems, taxRateInput) => {
  try {
    const { subtotal, taxAmount, totalPrice, breakdown } = await calculateItemizedPrice(serviceItems, taxRateInput);
    return { subtotal, taxAmount, totalPrice, breakdown: [{ name: 'Bundled Service', total: totalPrice }] };
  } catch (error) {
    console.error(`Error calculating bundled price: ${error.message}`, error);
    throw error;
  }
};

const calculateQuotePrice = async (quote, option = 'itemized', taxRateInput) => {
  try {
    switch (option) {
      case 'bundled':
        return await calculateBundledPrice(quote.serviceItems, taxRateInput);
      case 'itemized':
      default:
        return await calculateItemizedPrice(quote.serviceItems, taxRateInput);
    }
  } catch (error) {
    console.error(`Error calculating quote price: ${error.message}`, error);
    throw error;
  }
};

module.exports = { calculateQuotePrice };