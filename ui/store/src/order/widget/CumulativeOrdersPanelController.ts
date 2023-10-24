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
      style: {
        backgroundColor: '#212121',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'flex-start',
        paddingTop: '0px',
        paddingLeft: '16px',
        paddingBottom: '16px',
        paddingRight: '16px',
      }
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
      return HtmlView.fromNode(el).set({
        style: {
          fontFamily: 'sans-serif',
          fontSize: '16px',
          fontWeight: '400',
          textAlign: 'center',
          margin: 0,
          marginBottom: '16px',
          color: '#CCCCCC',
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
      return HtmlView.fromNode(el).set({
        style: {
          margin: 0,
          marginBottom: '4px',
          fontFamily: 'sans-serif',
          fontSize: '14px',
          fontWeight: '400',
          textAlign: 'center', 
          whiteSpace: 'nowrap',
          color: '#CCCCCC',
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
      return HtmlView.fromNode(el).set({
        style: {
          margin: '0px',
          fontFamily: 'sans-serif',
          fontSize: '14px',
          fontWeight: '400',
          textAlign: 'center',
          whiteSpace: 'nowrap',
          color: '#CCCCCC',
        }
      })
    }
  })
  readonly value!: ViewRef<this, HtmlView>;

  updateDisplay(entityStatus: EntityStatus): void {
    if (this.orderType !== OrderType.Unknown) {
      const readyCount = entityStatus[OrderStatus.readyForPickup][this.orderType].count;
      const pickedUpCount = entityStatus[OrderStatus.pickupCompleted][this.orderType].count;
      this.count.attachView().node.innerText = `Count: ${readyCount + pickedUpCount}`;

      const readyValue = entityStatus[OrderStatus.readyForPickup][this.orderType].value;
      const pickedUpValue = entityStatus[OrderStatus.pickupCompleted][this.orderType].value;
      this.value.attachView().node.innerText = `Value: $${readyValue + pickedUpValue}.00`;
    } else {
      const totalCount = entityStatus[OrderStatus.readyForPickup].total.count + entityStatus[OrderStatus.pickupCompleted].total.count;
      this.count.attachView().node.innerText = `Count: ${totalCount}`;
      
      const totalValue = entityStatus[OrderStatus.readyForPickup].total.value + entityStatus[OrderStatus.pickupCompleted].total.value;
      this.value.attachView().node.innerText = `Value: $${totalValue}.00`;
    }
  }
}
