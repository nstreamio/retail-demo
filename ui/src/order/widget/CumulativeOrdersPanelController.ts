import { HtmlView } from "@swim/dom";
import { PanelController } from "@swim/panel"
import { ViewRef } from "@swim/view";
import { OrderStatus, OrderType } from "../../types";
import { ValueDownlink } from "@swim/client";
import { StoreStatus } from "../../types";
import { Value } from "@swim/structure";

export class CumulativeOrdersPanelController extends PanelController {
  readonly orderType: OrderType;
  readonly isCumulative: boolean;

  constructor(orderType: OrderType, isCumulative: boolean = false) {
    super();
    this.orderType = orderType;
    this.isCumulative = isCumulative;
    this.mainStatusDownlink.open();
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
          color: '#5ba2ed',
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

  @ValueDownlink({
    hostUri: 'warp://localhost:9001',
    nodeUri: 'store/main',
    laneUri: 'status',
    consumed: true,
    didSet(value: Value): void {
      const storeStatus = this.owner.parseStoreStatus(value);

      if (this.owner.orderType !== OrderType.Unknown) {
        const readyCount = storeStatus[OrderStatus.readyForPickup][this.owner.orderType].count;
        const pickedUpCount = storeStatus[OrderStatus.pickupCompleted][this.owner.orderType].count;
        this.owner.count.attachView().node.innerText = `Count: ${readyCount + pickedUpCount}`;

        const readyValue = storeStatus[OrderStatus.readyForPickup][this.owner.orderType].value;
        const pickedUpValue = storeStatus[OrderStatus.pickupCompleted][this.owner.orderType].value;
        this.owner.value.attachView().node.innerText = `Value: $${readyValue + pickedUpValue}.00`;
      } else {
        const totalCount = storeStatus[OrderStatus.readyForPickup].total.count + storeStatus[OrderStatus.pickupCompleted].total.count;
        this.owner.count.attachView().node.innerText = `Count: ${totalCount}`;
        
        const totalValue = storeStatus[OrderStatus.readyForPickup].total.value + storeStatus[OrderStatus.pickupCompleted].total.value;
        this.owner.value.attachView().node.innerText = `Value: $${totalValue}.00`;
      }
    }
  })
  readonly mainStatusDownlink!: ValueDownlink<this>;

  private parseStoreStatus(v: Value): StoreStatus {
    return [OrderStatus.orderPlaced, OrderStatus.orderProcessed, OrderStatus.readyForPickup, OrderStatus.pickupCompleted].reduce((acc, s) => {
      [OrderType.OrderA, OrderType.OrderB, OrderType.OrderC].forEach(t => {
        let count = v.get(s).get(t).numberValue(0);
        let value = count * CumulativeOrdersPanelController.valuePerOrderType[t];
        if (!acc[s]) { acc[s] = { total: { count: 0, value: 0 } } as StoreStatus[OrderStatus]; }
        acc[s][t] = { count, value };
        acc[s].total.count += count;
        acc[s].total.value += value;
      });
      return acc;
    }, {} as StoreStatus);
  };

  private static valuePerOrderType: Record<OrderType, number> = {
    [OrderType.OrderA]: 10,
    [OrderType.OrderB]: 20,
    [OrderType.OrderC]: 30,
    [OrderType.Unknown]: 0,
  };
}
