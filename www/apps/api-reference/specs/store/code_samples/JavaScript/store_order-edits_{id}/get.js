import Medusa from "@medusajs/medusa-js"
const medusa = new Medusa({ baseUrl: MEDUSA_BACKEND_URL, maxRetries: 3 })
medusa.orderEdits.retrieve(orderEditId)
.then(({ order_edit }) => {
  console.log(order_edit.id);
})
