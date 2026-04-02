import { getScraperStatus, triggerScraping, cleanupOldArticles } from './lib/api.js';

async function testAdminAPI() {
    console.log('Testing Admin API functions...');

    try {
        console.log('1. Testing getScraperStatus...');
        const status = await getScraperStatus();
        console.log('Status:', status);

        console.log('2. Testing triggerScraping...');
        const triggerResult = await triggerScraping(10);
        console.log('Trigger result:', triggerResult);

        console.log('3. Testing cleanupOldArticles...');
        const cleanupResult = await cleanupOldArticles(30);
        console.log('Cleanup result:', cleanupResult);

    } catch (error) {
        console.error('Error:', error);
    }
}

testAdminAPI();