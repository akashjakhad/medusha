import Medusa from "@medusajs/medusa-js"
const medusa = new Medusa({ baseUrl: MEDUSA_BACKEND_URL, maxRetries: 3 })
// must be previously logged in or use api token
medusa.admin.returnReasons.retrieve(returnReasonId)
.then(({ return_reason }) => {
  console.log(return_reason.id);
})
