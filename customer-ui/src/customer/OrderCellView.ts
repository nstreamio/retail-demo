import {HtmlView} from "@swim/dom";
import { OrderType } from "../types";
import { HtmlIconView, VectorIcon } from "@swim/graphics";

export class OrderCellView extends HtmlView {

  readonly orderType: OrderType;

  constructor(orderType: OrderType) {
    super(document.createElement('div'));
    this.orderType = orderType
    this.initView();
  }

  initView(): void {
    this.classList.add('order-cell-content');
    this.style.set({
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'flex-start',
      alignItems: 'flex-end',
    });

    // define and insert svg
    this.appendChild(HtmlIconView).setIntrinsic({
      graphics: VectorIcon.create(
        24,
        24,
        "M12,2L22,22L2,22Z"
      ),
      style: {
        width: "40px",
        height: "40px",
        marginRight: "18px",
        marginBottom: "-2px",
      },
      classList: ["order-cell-svg"],
    });

    // define and insert text element
    const pEl = document.createElement('p')
    pEl.innerText = `Order ${this.orderType}`;
    const textView = this.appendChild('p').set({
      style: {
        height: 'min-content',
        fontWeight: "400",
        fontSize: "16px",
        lineHeight: "17px",
        color: "#FFFFFF",
        margin: "0px",
        boxSizing: "border-box",
      },
    });
    textView.node.innerText = `Order ${this.orderType}`;
  }
}
