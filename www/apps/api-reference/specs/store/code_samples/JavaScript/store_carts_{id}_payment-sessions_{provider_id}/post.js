import Medusa from "@medusajs/medusa-js"
const medusa = new Medusa({ baseUrl: MEDUSA_BACKEND_URL, maxRetries: 3 })
medusa.carts.updatePaymentSession(cartId, "manual", {
  data: {

  }
})
.then(({ cart }) => {
  console.log(cart.id);
})
