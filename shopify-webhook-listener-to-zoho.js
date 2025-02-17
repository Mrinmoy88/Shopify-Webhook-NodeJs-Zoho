// Import required libraries
const express = require("express");
const app = express();
const port = 3000;
const axios = require('axios');

// Middleware to parse incoming JSON data
app.use(express.json());

// Variables to store the latest order number, access token, and sales order ID
let latestOrderNumber = null;
let accessToken = null;
let salesOrderId = null;  // Variable to store the sales order ID
let organization_id = '774065561';

// The Zoho OAuth token generation URL
const zohoOAuthURL = 'https://accounts.zoho.com/oauth/v2/token';

// The data to be sent in the request body for OAuth
const data = {
    redirect_uri: 'http://www.zoho.com/inventory',
    refresh_token: '1000.5f326be9bb611e180d653ccbc2c40314.71408eb4deed36789a8e7f544f9e267c',  // Your refresh token
    client_id: '1000.Y4ZMXVGRZJ19ZF90RJQZO6XQTAE9HR',  // Your client ID
    client_secret: '951cc74c0dd0163566449346ca66052e535f6cbe97',  // Your client secret
    grant_type: 'refresh_token'
};

// Handle POST requests to /webhook (Shopify will send this)
app.post("/webhook", (req, res) => {
    console.log("Webhook received:");
    
    // Extract the order number from the webhook data
    latestOrderNumber = req.body.order_number; // Assuming order_number is in the top-level object
    console.log("Order Number:", latestOrderNumber);  // Log the order number to the console

    // Trigger the OAuth token request after receiving the webhook
    axios.post(zohoOAuthURL, new URLSearchParams(data))
        .then(response => {
            accessToken = response.data.access_token;  // Store the access token
            console.log('Access Token:', accessToken); // Log the access token
            
            // Fetch the sales order after successfully getting the access token
            fetchSalesOrder();
        })
        .catch(error => {
            console.error('Error during OAuth token request:', error.response ? error.response.data : error.message);
        });
    
    // Send a response back to Shopify
    res.status(200).send("Webhook received successfully");
});

// Function to fetch sales order from Zoho Inventory API
function fetchSalesOrder() {
    const referenceNumber = latestOrderNumber;  // Use the latest order number as reference number
    const salesOrderURL = `https://www.zohoapis.com/inventory/v1/salesorders?organization_id=${organization_id}&reference_number=${referenceNumber}`;

    axios.get(salesOrderURL, {
        headers: {
            'Authorization': `Zoho-oauthtoken ${accessToken}`
        }
    })
    .then(response => {
        if (response.data.salesorders && response.data.salesorders.length > 0) {
            salesOrderId = response.data.salesorders[0].salesorder_id;  // Extract the sales order ID
            console.log('Sales Order ID:', salesOrderId);  // Log the sales order ID to the console
            
            // Fetch full sales order details using the sales order ID
            fetchFullSalesOrderDetails(salesOrderId);
        } else {
            console.log('No sales orders found for this reference number');
        }
    })
    .catch(error => {
        console.error('Error fetching sales order:', error.response ? error.response.data : error.message);
    });
}

// Function to fetch full sales order details using salesorder_id
function fetchFullSalesOrderDetails(salesOrderId) {
    const salesOrderDetailsURL = `https://www.zohoapis.com/inventory/v1/salesorders/${salesOrderId}?organization_id=${organization_id}`;

    axios.get(salesOrderDetailsURL, {
        headers: {
            'Authorization': `Zoho-oauthtoken ${accessToken}`
        }
    })
    .then(response => {
        fullsalesOrder = response.data;
        console.log('Full Sales Order Data:', response.data);
        // You can process and print the entire sales order data as needed here
    })
    .catch(error => {
        console.error('Error fetching full sales order data:', error.response ? error.response.data : error.message);
    });
}

// Handle GET requests to / (root) - Show the latest order number, access token, and sales order ID in the browser
app.get("/", (req, res) => {
    if (latestOrderNumber && accessToken && salesOrderId) {
        // Display the latest order number, access token, and sales order ID in the browser
        res.send(`
            <h1>Latest Order Number:</h1>
            <p>${latestOrderNumber}</p>
            <h1>Access Token:</h1>
            <p>${accessToken}</p>
            <h1>Sales Order ID:</h1>
            <p>${salesOrderId}</p>
            <pre>${JSON.stringify(fullsalesOrder, null, 2)}</pre>
        `);  // Send the order number, access token, and sales order ID to the browser
    } else {
        res.send("Hello! The webhook listener is running. No order number, access token, or sales order ID received yet.");
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
