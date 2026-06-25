// To run: npx tsx scratch/simulate-callback.ts --requestId=ws_CO_... --status=success|cancel|timeout

async function simulate() {
  const args = process.argv.slice(2);
  const getArgValue = (name: string) => {
    const arg = args.find((a) => a.startsWith(`--${name}=`));
    return arg ? arg.split("=")[1] : null;
  };

  const requestId = getArgValue("requestId");
  const status = getArgValue("status") || "success";

  if (!requestId) {
    console.error("Error: --requestId is required.");
    console.log("Usage: npx tsx scratch/simulate-callback.ts --requestId=ws_CO_12345 --status=success|cancel|timeout");
    process.exit(1);
  }

  let callbackBody: any = {};

  if (status === "success") {
    const randomReceipt = "MP" + Math.random().toString(36).substring(2, 10).toUpperCase();
    callbackBody = {
      Body: {
        stkCallback: {
          MerchantRequestID: "MOCK_MERCHANT_REQ_ID",
          CheckoutRequestID: requestId,
          ResultCode: 0,
          ResultDesc: "The service request is processed successfully.",
          CallbackMetadata: {
            Item: [
              { Name: "Amount", Value: 2500.0 },
              { Name: "MpesaReceiptNumber", Value: randomReceipt },
              { Name: "TransactionDate", Value: parseInt(new Date().toISOString().replace(/\D/g, "").substring(0, 14)) },
              { Name: "PhoneNumber", Value: 254712345678 }
            ]
          }
        }
      }
    };
  } else if (status === "cancel") {
    callbackBody = {
      Body: {
        stkCallback: {
          MerchantRequestID: "MOCK_MERCHANT_REQ_ID",
          CheckoutRequestID: requestId,
          ResultCode: 1032,
          ResultDesc: "Request cancelled by user."
        }
      }
    };
  } else if (status === "timeout") {
    callbackBody = {
      Body: {
        stkCallback: {
          MerchantRequestID: "MOCK_MERCHANT_REQ_ID",
          CheckoutRequestID: requestId,
          ResultCode: 1037,
          ResultDesc: "DS timeout user response."
        }
      }
    };
  } else {
    console.error(`Error: Unknown status '${status}'. Must be success, cancel, or timeout.`);
    process.exit(1);
  }

  console.log(`Sending simulated M-Pesa callback for request ID: ${requestId}`);
  console.log(`Status: ${status.toUpperCase()}`);

  try {
    const response = await fetch("http://localhost:3000/api/payments/callback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(callbackBody)
    });

    const responseBody = await response.json();
    console.log(`Callback endpoint response status: ${response.status}`);
    console.log("Response body:", JSON.stringify(responseBody, null, 2));

    if (response.ok) {
      console.log("✅ Simulation successfully executed.");
    } else {
      console.log("❌ Simulation failed.");
    }
  } catch (error) {
    console.error("Error calling callback endpoint:", error);
  }
}

simulate();
