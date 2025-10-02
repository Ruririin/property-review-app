// Test script to verify the bestPlacesAutomation service imports correctly
import bestPlacesAutomation from './src/services/bestPlacesAutomation.js';

console.log('✅ Successfully imported bestPlacesAutomation service');
console.log('Service instance:', bestPlacesAutomation);
console.log('Available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(bestPlacesAutomation)));
