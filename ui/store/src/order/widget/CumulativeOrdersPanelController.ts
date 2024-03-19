import { HtmlView } from "@swim/dom";
import { PanelController } from "@swim/panel"
import { ViewRef } from "@swim/view";
import { OrderStatus, OrderType } from "../../types";
import { EntityStatus } from "../../types";

export class CumulativeOrdersPanelController extends PanelController {
  readonly orderType: OrderType;
  readonly isCumulative: boolean;

  constructor(orderType: OrderType, isCumulative: boolean = false) {
    super();
    this.orderType = orderType;
    this.isCumulative = isCumulative;
    this.initView();
  }

  private initView(): void {
    const panelView = this.panel.insertView().set({
      minPanelHeight: 106,
      classList: ["cumulative-orders-panel"],
    });
    this.header.insertView(panelView);
    this.count.insertView(panelView);
    this.value.insertView(panelView);
  }

  @ViewRef({
    viewType: HtmlView,
    viewKey: 'header',
    extends: true,
    createView(): HtmlView {
      const el = document.createElement('h2');
      el.innerText = `Processed ${this.owner.isCumulative ? 'All' : this.owner.orderType} Orders`;

      const isDarkTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return HtmlView.fromNode(el).set({
        style: {
          fontFamily: 'sans-serif',
          fontSize: '16px',
          fontWeight: '400',
          textAlign: 'center',
          margin: 0,
          marginBottom: '16px',
          color: isDarkTheme ? "#CCCCCC" : "#000000",
        }
      })
    }
  })
  readonly header!: ViewRef<this, HtmlView>;

  @ViewRef({
    viewType: HtmlView,
    viewKey: 'count',
    extends: true,
    createView(): HtmlView {
      const el = document.createElement('p');
      el.innerText = `Count: 0`;

      const isDarkTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return HtmlView.fromNode(el).set({
        style: {
          margin: 0,
          marginBottom: '4px',
          fontFamily: 'sans-serif',
          fontSize: '14px',
          fontWeight: '400',
          textAlign: 'center', 
          whiteSpace: 'nowrap',
          color: isDarkTheme ? "#CCCCCC" : "#000000",
        }
      })
    }
  })
  readonly count!: ViewRef<this, HtmlView>;

  @ViewRef({
    viewType: HtmlView,
    viewKey: 'value',
    extends: true,
    createView(): HtmlView {
      const el = document.createElement('p');
      el.innerText = `Value: $0.00`;

      const isDarkTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return HtmlView.fromNode(el).set({
        style: {
          margin: '0px',
          fontFamily: 'sans-serif',
          fontSize: '14px',
          fontWeight: '400',
          textAlign: 'center',
          whiteSpace: 'nowrap',
          color: isDarkTheme ? "#CCCCCC" : "#000000",
        }
      })
    }
  })
  readonly value!: ViewRef<this, HtmlView>;

  updateDisplay(entityStatus: EntityStatus): void {
    if (this.orderType !== OrderType.Unknown) {
      const pickedUpCount = entityStatus[OrderStatus.pickupCompleted][this.orderType].count;
      this.count.attachView().node.innerText = `Count: ${pickedUpCount}`;

      const pickedUpValue = entityStatus[OrderStatus.pickupCompleted][this.orderType].value;
      this.value.attachView().node.innerText = `Value: $${pickedUpValue}.00`;
    } else {
      const totalCount = entityStatus[OrderStatus.pickupCompleted].total.count;
      this.count.attachView().node.innerText = `Count: ${totalCount}`;
      
      const totalValue = entityStatus[OrderStatus.pickupCompleted].total.value;
      this.value.attachView().node.innerText = `Value: $${totalValue}.00`;
    }
  }
}
