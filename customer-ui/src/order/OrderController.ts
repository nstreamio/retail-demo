import { TimeSeriesController } from "@swim/widget";
import { View, ViewRef } from "@swim/view";
import { LeafView, RowView, TextCellView } from "@swim/table";
import { Look } from "@swim/theme";
import { OrderType } from "../types";
import { Observes } from "@swim/util";

/** @public */
export class OrderController extends TimeSeriesController {
  readonly orderId: string;
  readonly orderType: OrderType;

  constructor(orderId: string, orderType: OrderType) {
    console.log('OrderController constructor');
    super();
    this.setKey(orderId);
    this.orderId = orderId;
    this.orderType = orderType;
  }

  @ViewRef({
    viewType: RowView,
    extends: true,
    initView(rowView: RowView): void {
      rowView.set({
        style: {
          height: '72px',
        },
      });
    }
  })
  override readonly row!: ViewRef<this, RowView>;

  @ViewRef({
    viewType: LeafView,
    extends: true,
    initView(leafView: LeafView): void {
      leafView.set({
        style: {
          height: '40px',
          marginTop: '16px',
          marginBottom: '16px',
        }
      });
    },
    viewDidPress(): void {
      // disable default press action
      return;
    },
    viewDidLongPress(): void {
      // disable default long press action
      return;
    }
  })
  override readonly leaf!: ViewRef<this, LeafView> & Observes<LeafView>;

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
  readonly orderTypeCell!: ViewRef<this, TextCellView>;

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
