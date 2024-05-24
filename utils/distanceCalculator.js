const axios = require('axios');

// Ensure the GOOGLE_API_KEY is set in the environment variables
if (!process.env.GOOGLE_API_KEY) {
  throw new Error('GOOGLE_API_KEY is not set. Please set your Google API key in the environment variables.');
}
const { GOOGLE_API_KEY } = process.env;

/**
 * Validates the input for origin and destination to ensure they are not empty and are strings.
 * @param {String} origin - The starting point address or coordinates.
 * @param {String} destination - The destination address or coordinates.
 */
function validateInput(origin, destination) {
  if (typeof origin !== 'string' || typeof destination !== 'string' || origin.trim() === '' || destination.trim() === '') {
    throw new Error('Origin and destination must be non-empty strings.');
  }
}

/**
 * Calculates the distance between two locations using the Google Distance Matrix API.
 * @param {String} origin - The starting point address or coordinates.
 * @param {String} destination - The destination address or coordinates.
 * @returns {Promise<Number>} The distance in miles, or null if an error occurs.
 */
async function calculateDistance(origin, destination) {
  validateInput(origin, destination); // Validate input before making the API call

  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
      params: {
        origins: origin,
        destinations: destination,
        key: GOOGLE_API_KEY,
        units: 'imperial' // Miles
      }
    });

    if (response.data.status === 'OK') {
      const distanceInMeters = response.data.rows[0].elements[0].distance.value;
      const distanceInMiles = distanceInMeters / 1609.34; // Convert meters to miles
      console.log(`Distance calculated: ${distanceInMiles} miles`);
      return distanceInMiles;
    } else {
      console.error(`Google Distance Matrix API error: ${response.data.status}`);
      return null;
    }
  } catch (error) {
    console.error(`Error calculating distance: ${error.message}`, error);
    return null;
  }
}

module.exports = { calculateDistance };