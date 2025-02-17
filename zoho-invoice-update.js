const axios = require('axios');

const organizationId = "774065561";
let accessToken = null;


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

async function updateLastInvoice() {
  try {
    // Step 1: Get the last Sales Order
    let salesOrderResponse = await axios.get(`https://www.zohoapis.com/inventory/v1/salesorders`, {
      headers: { Authorization: `Zoho-oauthtoken ${accessToken}` },
      params: { organization_id: organizationId, sort_column: "created_time", sort_order: "desc", per_page: 1 }
    });

    const salesOrderId = salesOrderResponse.data.salesorders[0]?.salesorder_id;
    if (!salesOrderId) throw new Error("No sales order found");

    // Step 2: Get the invoice for that Sales Order
    let invoiceResponse = await axios.get(`https://www.zohoapis.com/inventory/v1/invoices`, {
      headers: { Authorization: `Zoho-oauthtoken ${accessToken}` },
      params: { organization_id: organizationId, salesorder_id: salesOrderId }
    });

    const invoiceId = invoiceResponse.data.invoices[0]?.invoice_id;
    if (!invoiceId) throw new Error("No invoice found for this sales order");

    // Step 3: Update the Invoice
    let updateResponse = await axios.put(`https://www.zohoapis.com/inventory/v1/invoices/${invoiceId}`, 
      { customer_notes: "Updated invoice details", adjustment: 10.00 },
      { headers: { Authorization: `Zoho-oauthtoken ${accessToken}`, 'Content-Type': 'application/json' }, 
        params: { organization_id: organizationId } }
    );

    console.log("Invoice updated:", updateResponse.data);
  } catch (error) {
    console.error("Error updating invoice:", error.response?.data || error.message);
  }
}

updateLastInvoice();
