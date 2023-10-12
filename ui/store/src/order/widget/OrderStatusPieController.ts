// Copyright 2015-2022 Swim.inc
// All rights reserved.

import {Timing, type Mapping, Easing} from "@swim/util";
import type {Value} from "@swim/structure";
import {ValueDownlink} from "@swim/client";
import type {Trait} from "@swim/model";
import {TraitViewRef} from "@swim/controller";
import type {PanelView} from "@swim/panel";
import {TimePieController} from "@nstream/widget";
import {Status} from "@nstream/domain";
import { OrderStatus, OrderType } from "../../types";
import { ViewRef } from "@swim/view";
import { PieView, SliceView } from "@swim/pie";
import { Feel, Look } from "@swim/theme";
import { HtmlView } from "@swim/dom";
import { StoreStatus } from "../../types";
import { OrderListController } from "./OrderListController";
import { Property } from "@swim/component";

/** @public */
export class OrderStatusPieController extends TimePieController {

  readonly orderStatus: OrderStatus;
  readonly headerTitle: string;

  constructor(orderStatus: OrderStatus, headerTitle: string) {
    super();
    this.orderStatus = orderStatus;
    this.headerTitle = headerTitle;
  }

  @TraitViewRef({
    extends: true,
    initView(panelView: PanelView): void {
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
          fontSize: '16px',
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
    viewKey: OrderType.OrderA,
    extends: true,
    initView(sliceView: SliceView): void {
      sliceView.set({
        sliceColor: OrderStatusPieController.sliceColors[this.owner.orderStatus][OrderType.OrderA],
        font: "14px sans-serif",
        textColor: Look.backgroundColor,
        innerRadius: 30,
        outerRadius: 80,
        value: 1 / 3,
        legend: "A Orders",
      });
      sliceView.modifyMood(Feel.default, Status.Normal!.moodModifier);
      sliceView.legend.attachView().modifyMood(Feel.default, [[Feel.selected, 2]]);
    }
  })
  readonly aSlice!: ViewRef<this, SliceView>;

  @ViewRef({
    viewType: SliceView,
    viewKey: OrderType.OrderB,
    extends: true,
    initView(sliceView: SliceView): void {
      sliceView.set({
        sliceColor: OrderStatusPieController.sliceColors[this.owner.orderStatus][OrderType.OrderB],
        font: "14px sans-serif",
        textColor: Look.backgroundColor,
        innerRadius: 30,
        outerRadius: 80,
        value: 1 / 3,
        legend: "B Orders",
      });
      sliceView.modifyMood(Feel.default, Status.Warning!.moodModifier);
      sliceView.legend.attachView().modifyMood(Feel.default, [[Feel.selected, 2]]);
    }
  })
  readonly bSlice!: ViewRef<this, SliceView>;

  @ViewRef({
    viewType: SliceView,
    viewKey: OrderType.OrderC,
    extends: true,
    initView(sliceView: SliceView): void {
      sliceView.set({
        sliceColor: OrderStatusPieController.sliceColors[this.owner.orderStatus][OrderType.OrderC],
        font: "14px sans-serif",
        textColor: Look.backgroundColor,
        innerRadius: 30,
        outerRadius: 80,
        value: 1 / 3,
        legend: "C Orders",
      });
      sliceView.modifyMood(Feel.default, Status.Unknown!.moodModifier);
      sliceView.legend.attachView().modifyMood(Feel.default, [[Feel.selected, 2]]);
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

  @Property({
    valueType: String,
    value: '',
    didSetValue(newValue: string): void {
      if (this.owner.orderStatus === OrderStatus.orderPlaced) {
        this.owner.aSlice.attachView().set({
          outerRadius: newValue === OrderType.OrderA ? 90 : 80
        }, Timing(Easing('linear'), 0, 200));
        this.owner.bSlice.attachView().set({
          outerRadius: newValue === OrderType.OrderB ? 90 : 80
        }, Timing(Easing('linear'), 0, 200));
        this.owner.cSlice.attachView().set({
          outerRadius: newValue === OrderType.OrderC ? 90 : 80
        }, Timing(Easing('linear'), 0, 200));
      }
    }
  })
  readonly focusedOrderType!: Property<this, String>;

  @ValueDownlink({
    laneUri: 'status',
    inherits: true,
    consumed: true,
    didSet(value: Value): void {
      const storeStatus = OrderListController.parseStoreStatus(value);
      
      this.owner.updateSlice(storeStatus, this.owner.aSlice, OrderType.OrderA);
      this.owner.updateSlice(storeStatus, this.owner.bSlice, OrderType.OrderB);
      this.owner.updateSlice(storeStatus, this.owner.cSlice, OrderType.OrderC);

      const totalValue = storeStatus[this.owner.orderStatus].total.value;
      this.owner.totalMonetaryValue.view!.node.innerText = totalValue ? `$${totalValue}` : this.owner.getEmptyStateText();
    }
  })
  readonly statusDownlink!: ValueDownlink<this>;

  private getEmptyStateText(): string {
    if (this.orderStatus === OrderStatus.orderPlaced) {
      return 'No new orders';
    } else if (this.orderStatus === OrderStatus.orderProcessed) {
      return 'No orders being processed';
    } else {
      return 'No orders ready for pickup';
    }
  };

  private updateSlice(storeStatus: StoreStatus, slice: ViewRef<this, SliceView>, type: OrderType) {
    const value = storeStatus[this.orderStatus][type].value;
    const label = `$${storeStatus[this.orderStatus][type].value}`;
    if (!value) {
      slice.removeView();
    } else {
      slice.insertView(this.pie.attachView()).set({
        value,
        label: value / storeStatus[this.orderStatus].total.value > 0.2 ? label : '',
      });
    }
  };

  static readonly alertStatus: Mapping<number, Status> = Status.improving(0, 2.5, 3.5, 4.5, 5);

  static readonly sliceColors: Record<OrderStatus, Record<OrderType, string>> = {
    [OrderStatus.orderPlaced]: {
      [OrderType.OrderA]: '#F59D56',
      [OrderType.OrderB]: '#F7913E',
      [OrderType.OrderC]: '#ED7A1C',
      [OrderType.Unknown]: '#FFFFFF',
    },
    [OrderStatus.orderProcessed]: {
      [OrderType.OrderA]: '#F5EE8C',
      [OrderType.OrderB]: '#F9F070',
      [OrderType.OrderC]: '#F5E942',
      [OrderType.Unknown]: '#FFFFFF',
    },
    [OrderStatus.readyForPickup]: {
      [OrderType.OrderA]: '#8CFAE1',
      [OrderType.OrderB]: '#57FAD6',
      [OrderType.OrderC]: '#02FAC3',
      [OrderType.Unknown]: '#FFFFFF',
    },
    [OrderStatus.pickupCompleted]: {
      [OrderType.OrderA]: '#FFFFFF',
      [OrderType.OrderB]: '#FFFFFF',
      [OrderType.OrderC]: '#FFFFFF',
      [OrderType.Unknown]: '#FFFFFF',
    },
  };
}
