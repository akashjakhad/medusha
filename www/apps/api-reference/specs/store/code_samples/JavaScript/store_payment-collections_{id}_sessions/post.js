import Medusa from "@medusajs/medusa-js"
const medusa = new Medusa({ baseUrl: MEDUSA_BACKEND_URL, maxRetries: 3 })
// must be previously logged in or use api token
medusa.paymentCollections.managePaymentSession(payment_id, { provider_id: "stripe" })
.then(({ payment_collection }) => {
  console.log(payment_collection.id);
})
