// Copyright 2015-2022 Swim.inc
// All rights reserved.

import {PanelView, PanelController} from "@swim/panel";
import {TimeTableController} from "@swim/widget";
import {ViewRef} from "@swim/view";
import { MapDownlink } from "@swim/client";
import { Form, Value } from "@swim/structure";
import { OrderController } from "./OrderController";
import { TraitViewRef } from "@swim/controller";
import { Trait } from "@swim/model";

/** @public */
export class OrderListController extends TimeTableController {

  readonly listTitle: string;
  readonly eventKey: string;

  constructor(title: string, key: string) {
    super();
    this.listTitle = title;
    this.eventKey = key;
  }

  @TraitViewRef<OrderListController["panel"]>({
    extends: true,
    initView(panelView: PanelView): void {
      PanelController.panel.prototype.initView.call(this, panelView);
      panelView.header.setTitle(this.owner.listTitle);
      this.owner.table.insertView();
    },
  })
  override readonly panel!: TraitViewRef<this, Trait, PanelView> & TimeTableController["panel"];

  @ViewRef<OrderListController["tablePanel"]>({
    extends: true,
    initView(panelView: PanelView): void {
      PanelController.panel.prototype.initView.call(this, panelView);
      panelView.marginTop(48);
      panelView.unitHeight.setValue(1);
    },
  })
  override readonly tablePanel!: ViewRef<this, PanelView> & TimeTableController["tablePanel"];

  @MapDownlink<OrderListController["ordersDownlink"]>({
    laneUri: "orders",
    consumed: true,
    keyForm: Form.forString(),
    didUpdate(orderId: string, value: Value): void {

      let orderController = this.owner.getChild(orderId, OrderController);

      if (orderController === null && this.owner.eventKey === value.get("status").get("eventName").stringValue("")) {

        orderController = new OrderController();
        orderController.nameCell.insertView();
        orderController.title.setValue(orderId);
        this.owner.series.addController(orderController, void 0, orderId);

      }  

      if (orderController !== null && this.owner.eventKey !== value.get("status").get("eventName").stringValue("")) {

        this.owner.removeChild(orderId);

      }

    },
    didRemove(orderId: string) {
      this.owner.removeChild(orderId);
    }
  })
  readonly ordersDownlink!: MapDownlink<this, string, Value>;





}