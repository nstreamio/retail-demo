import { TimeSeriesController } from "@swim/widget";
import { View, ViewRef } from "@swim/view";
import { TextCellView } from "@swim/table";
import { Look } from "@swim/theme";
import { OrderType } from "../types";

/** @public */
export class OrderController extends TimeSeriesController {
  readonly orderId: string;
  readonly orderType: OrderType;

  constructor(orderId: string, orderType: OrderType) {
    super();
    this.setKey(orderId);
    this.orderId = orderId;
    this.orderType = orderType;
  }

  @ViewRef({
    viewType: TextCellView,
    viewKey: "shape",
    extends: true,
    get parentView(): View | null {
      return this.owner.leaf.insertView();
    },
    createView(): TextCellView {
      return TextCellView.create().set({
        style: {
          color: Look.accentColor,
        }
      });
    }
  })
  readonly shapeCell!: ViewRef<this, TextCellView>;

  @ViewRef({
    viewType: TextCellView,
    viewKey: "order",
    extends: true,
    get parentView(): View | null {
      return this.owner.leaf.insertView();
    },
    createView(): TextCellView {
      return TextCellView.create().set({
        style: {
          color: Look.accentColor,
        }
      });
    }
  })
  readonly orderCell!: ViewRef<this, TextCellView>;

  @ViewRef({
    viewType: TextCellView,
    viewKey: "status",
    extends: true,
    get parentView(): View | null {
      return this.owner.leaf.insertView();
    },
    createView(): TextCellView {
      return TextCellView.create().set({
        style: {
          color: Look.accentColor,
        }
      });
    }
  })
  readonly statusCell!: ViewRef<this, TextCellView>;
}
