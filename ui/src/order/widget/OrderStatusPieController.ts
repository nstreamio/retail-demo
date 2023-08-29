// Copyright 2015-2022 Swim.inc
// All rights reserved.

import type {Mapping} from "@swim/util";
import type {Value} from "@swim/structure";
import {ValueDownlink} from "@swim/client";
import type {Trait} from "@swim/model";
import {TraitViewRef} from "@swim/controller";
import type {PanelView} from "@swim/panel";
import {TimePieController} from "@swim/widget";
import {Status} from "@swim/domain";
import { OrderStatus, OrderType } from "../../types";
import { ViewRef } from "@swim/view";
import { PieView, SliceView } from "@swim/pie";
import { Feel, Look, Mood } from "@swim/theme";
import { HtmlView } from "@swim/dom";

type StoreStatus = Record<OrderStatus, Record<OrderType, { count: number, value: number}> & { totalValue: number }> & { totalValue: number };

/** @public */
export class OrderStatusPieController extends TimePieController {

  readonly orderStatus: OrderStatus;
  readonly headerTitle: string;

  constructor(orderStatus: OrderStatus, headerTitle: string) {
    super();
    this.orderStatus = orderStatus;
    this.headerTitle = headerTitle;

    this.mainStatusDownlink.open();
  }

  @TraitViewRef({
    extends: true,
    initView(panelView: PanelView): void {
      console.log('panel initView');
      super.initView(panelView);
      panelView.set({
        headerTitle: this.owner.headerTitle,
        // headerSubtitle: `headerSubtitle: ${this.owner.orderStatus}`,
      });

      this.owner.piePanel.insertView().setIntrinsic({
        unitHeight: 1,
        style: {
          marginTop: 24,
          marginBottom: 24,
        },
      });
      this.owner.pie.insertView();
      this.owner.totalMonetaryValue.insertView(panelView);
    },
  })
  override readonly panel!: TraitViewRef<this, Trait, PanelView> & TimePieController["panel"];

  @ViewRef({
    viewType: HtmlView,
    viewKey: "totalMonetaryValue",
    extends: true,
    createView(): HtmlView {
      const el = document.createElement('h2');
      el.innerText = '33%';
      const htmlView = HtmlView.fromNode(el).set({
        style: {
          position: 'absolute',
          top: '50%',
          left: '50%',
          margin: 0,
          transform: 'translate(-50%, -50%)',
          font: 'sans-serif',
          fontSize: '18px',
          fontWeight: '500',
          textAlign: 'center',
          color: '#CCCCCC'
        },
        classList: ['total-monetary-value'],
      });
      return htmlView;
    }
  })
  readonly totalMonetaryValue!: ViewRef<this, HtmlView>;

  @ViewRef({
    viewType: SliceView,
    viewKey: OrderStatus.orderPlaced,
    extends: true,
    initView(sliceView: SliceView): void {
      sliceView.set({
        sliceColor: Look.accentColor,
        font: "14px sans-serif",
        textColor: Look.backgroundColor,
        innerRadius: 30,
        outerRadius: 80,
        value: 1 / 3,
        legend: "A",
      });
      sliceView.modifyMood(Feel.default, Status.Normal!.moodModifier);
    }
  })
  readonly aSlice!: ViewRef<this, SliceView>;

  @ViewRef({
    viewType: SliceView,
    viewKey: OrderStatus.orderProcessed,
    extends: true,
    initView(sliceView: SliceView): void {
      sliceView.set({
        sliceColor: Look.accentColor,
        font: "14px sans-serif",
        textColor: Look.backgroundColor,
        innerRadius: 30,
        outerRadius: 80,
        value: 1 / 3,
        legend: "B",
      });
      // sliceView.modifyMood(Feel.default, OrderStatusPieController.alertStatus(5).moodModifier);
      sliceView.modifyMood(Feel.default, Status.Warning!.moodModifier);
    }
  })
  readonly bSlice!: ViewRef<this, SliceView>;

  @ViewRef({
    viewType: SliceView,
    viewKey: OrderStatus.readyForPickup,
    extends: true,
    initView(sliceView: SliceView): void {
      sliceView.set({
        sliceColor: Look.focusColor,
        font: "14px sans-serif",
        textColor: Look.backgroundColor,
        innerRadius: 30,
        outerRadius: 80,
        value: 1 / 3,
        legend: "C",
      });
      // sliceView.modifyMood(Feel.default, OrderStatusPieController.alertStatus(5).moodModifier);
      sliceView.modifyMood(Feel.default, Status.Unknown!.moodModifier);
    }
  })
  readonly cSlice!: ViewRef<this, SliceView>;

  @ViewRef({
    viewType: PieView,
    viewKey: 'pie',
    extends: true,
    initView(pieView: PieView): void {
      this.owner.aSlice.insertView(pieView);
      this.owner.bSlice.insertView(pieView);
      this.owner.cSlice.insertView(pieView);
    }
  })
  override readonly pie!: ViewRef<this, PieView>;

  @ValueDownlink({
    hostUri: 'warp://localhost:9001',
    nodeUri: 'store/main',
    laneUri: 'status',
    consumed: true,
    didSet(value: Value): void {
      const storeStatus = this.owner.parseStoreStatus(value);
      // if (this.owner.orderStatus === OrderStatus.orderProcessed) {
      //   console.log('storeStatus: ', storeStatus);
      // }
      
      this.owner.updateSlice(storeStatus, this.owner.aSlice, OrderType.OrderA);
      this.owner.updateSlice(storeStatus, this.owner.bSlice, OrderType.OrderB);
      this.owner.updateSlice(storeStatus, this.owner.cSlice, OrderType.OrderC);

      const totalValue = storeStatus[this.owner.orderStatus].totalValue;
      this.owner.totalMonetaryValue.view!.node.innerText = totalValue ? `$${totalValue}` : this.owner.getEmptyStateText();
    }
  })
  readonly mainStatusDownlink!: ValueDownlink<this>;

  private getEmptyStateText(): string {
    if (this.orderStatus === OrderStatus.orderPlaced) {
      return 'No new orders';
    } else if (this.orderStatus === OrderStatus.orderProcessed) {
      return 'No orders being processed';
    } else {
      return 'No orders ready for pickup';
    }
  }

  private updateSlice(storeStatus: StoreStatus, slice: ViewRef<this, SliceView>, type: OrderType) {
    const value = storeStatus[this.orderStatus][type].value;
    const label = `$${storeStatus[this.orderStatus][type].value}`;
    if (!value) {
      slice.removeView();
    } else {
      slice.insertView(this.pie.attachView()).set({
        value,
        label: value / storeStatus[this.orderStatus].totalValue > 0.2 ? label : '',
      });
    }
  }

  private parseStoreStatus(v: Value): StoreStatus {
    return [OrderStatus.orderPlaced, OrderStatus.orderProcessed, OrderStatus.readyForPickup].reduce((acc, s) => {
      [OrderType.OrderA, OrderType.OrderB, OrderType.OrderC].forEach(t => {
        let count = v.get(s).get(t).numberValue(0);
        let value = count * OrderStatusPieController.valuePerOrderType[t];
        acc[s][t] = { count, value };
        acc[s].totalValue += value;
        acc.totalValue += value;
      });
      return acc;
    }, { orderPlaced: { totalValue: 0 }, orderProcessed: { totalValue: 0 }, readyForPickup: { totalValue: 0 }, totalValue: 0 } as StoreStatus);
  };

  private static valuePerOrderType: Record<OrderType, number> = {
    [OrderType.OrderA]: 10,
    [OrderType.OrderB]: 20,
    [OrderType.OrderC]: 30,
    [OrderType.Unknown]: 0,
  };

  static readonly alertStatus: Mapping<number, Status> = Status.improving(0, 2.5, 3.5, 4.5, 5);
}
