const calculatePrice = (serviceType, frequency, rooms, squareFootage, extras, distance) => {
  console.log(`Calculating price for serviceType: ${serviceType}, frequency: ${frequency}, squareFootage: ${squareFootage}, distance: ${distance}`);
  let basePrice = 0;
  let extraCharges = 0;
  const pricePerSquareFoot = 0.01;
  const mileageCharge = 0.55;
  const mileageThreshold = 20;

  // Base price calculation based on square footage
  basePrice += squareFootage * pricePerSquareFoot;

  // Adding extra charges
  extras.forEach(extra => {
    console.log(`Adding extra charge for: ${extra}`);
    extraCharges += extra.price;
  });

  // Adding room charges
  rooms.forEach(room => {
    console.log(`Adding charge for room: ${room.name}`);
    basePrice += room.price;
  });

  // Adding mileage charge if applicable
  if (distance > mileageThreshold) {
    const extraMileage = distance - mileageThreshold;
    console.log(`Adding mileage charge for extra ${extraMileage} miles.`);
    extraCharges += extraMileage * mileageCharge;
  }

  // Adjusting price based on service frequency for recurring services
  if (serviceType === 'Recurring') {
    console.log(`Adjusting price for recurring service with frequency: ${frequency}`);
    switch (frequency) {
      case 'Weekly':
        basePrice *= 0.9; // 10% discount for weekly
        break;
      case 'Bi-Weekly':
        basePrice *= 0.95; // 5% discount for bi-weekly
        break;
      case 'Monthly':
        basePrice *= 0.97; // 3% discount for monthly
        break;
      default:
        console.log(`No frequency discount applied.`);
    }
  }

  const totalPrice = basePrice + extraCharges;
  console.log(`Total calculated price: $${totalPrice}`);
  return totalPrice;
};

module.exports = {
  calculatePrice
};