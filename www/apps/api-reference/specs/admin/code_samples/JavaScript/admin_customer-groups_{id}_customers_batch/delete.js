import Medusa from "@medusajs/medusa-js"
const medusa = new Medusa({ baseUrl: MEDUSA_BACKEND_URL, maxRetries: 3 })
// must be previously logged in or use api token
medusa.admin.customerGroups.removeCustomers(customerGroupId, {
  customer_ids: [
    {
      id: customerId
    }
  ]
})
.then(({ customer_group }) => {
  console.log(customer_group.id);
})
