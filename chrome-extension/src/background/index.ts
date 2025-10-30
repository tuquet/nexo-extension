import 'webextension-polyfill';
import { themeStorage } from '@extension/storage';

themeStorage.get().then(theme => {
  console.log('theme', theme);
});

console.log('Background loaded');
console.log("Edit 'chrome-extension/src/background/index.ts' and save to reload.");
