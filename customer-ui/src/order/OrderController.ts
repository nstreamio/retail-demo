import { TimeSeriesController } from "@swim/widget";

/** @public */
export class OrderController extends TimeSeriesController {
  readonly orderId: string;

  constructor(orderId: string) {
    super();
    this.setKey(orderId);
    this.orderId = orderId;
  }
}
