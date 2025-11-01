import 'webextension-polyfill';
import { initializeMessageRouter } from './router';
import { initializeVbeeTokenListener } from './vbee-token-handler';

/**
 * The main entry point for the background script.
 * This function initializes all the necessary modules and listeners
 * that need to run in the background.
 */
const main = () => {
  console.log('Background script starting...');
  initializeVbeeTokenListener();
  initializeMessageRouter();
  console.log('All background modules initialized.');
};

main();
