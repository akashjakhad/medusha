/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import { SetRelation, Merge } from "../core/ModelUtils"

export interface AdminPostOrdersOrderClaimsClaimShipmentsReq {
  /**
   * The ID of the Fulfillment.
   */
  fulfillment_id: string
  /**
   * An array of tracking numbers for the shipment.
   */
  tracking_numbers?: Array<string>
}
