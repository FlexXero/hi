const keep_alive = require('./keep_alive.js');
const axios = require('axios');
const cron = require('node-cron');

const webhookURL = 'https://discord.com/api/webhooks/1260792339576651847/JeTslNYrZToLwnmbAQG_m5ZRz5naMkV7VCgK-2wXADEIj7T70_2EPg0J1xEMGKrR26xC';
const jsonDataUrl = 'https://thingcdn.replit.app/data.json';

async function fetchDataAndSend() {
    try {
        const response = await axios.get(jsonDataUrl);
        const jsonData = response.data;

        const message = {
            content: 'Daily IndigoAPI Status Update:',
            embeds: [{
                title: 'IndigoAPI Status',
                description: `Version: ${jsonData.pornhubapi.version}\nPatched: ${jsonData.pornhubapi.patched}`,
                color: 0x00ff00 
            }]
        };
        
        await axios.post(webhookURL, message);
        console.log('Data sent to Discord successfully.');
    } catch (error) {
        console.error('Error fetching data or sending to Discord:', error.message);
    }
}

async function sendImmediately() {
    console.log('Sending data on start...');
    await fetchDataAndSend();
    console.log('Initial data sent.');

    cron.schedule('0 0 * * *', () => {
        console.log('Running daily data fetch and send job...');
        fetchDataAndSend();
    });
}

// Call sendImmediately to start the process
sendImmediately();
