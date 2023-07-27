// Copyright 2015-2022 Swim.inc
// All rights reserved.

import {PanelView} from "@swim/panel";
import {TimeTableController} from "@swim/widget";
import {ViewRef} from "@swim/view";
import { MapDownlink } from "@swim/client";
import { Form, Value } from "@swim/structure";
import { OrderController } from "./OrderController";
import { TraitViewRef } from "@swim/controller";
import { Trait } from "@swim/model";
import { TextCellView } from "@swim/table";
import { Uri } from "@swim/uri";

/** @public */
export class OrderListController extends TimeTableController {

  readonly listTitle: string;
  readonly eventKey: string;

  constructor(title: string, key: string) {
    super();
    this.listTitle = title;
    this.eventKey = key;
  }

  @TraitViewRef({
    extends: true,
    initView(panelView: PanelView): void {
      super.initView(panelView);
      panelView.headerTitle.set(this.owner.listTitle);
      this.owner.table.insertView();
    },
  })
  override readonly panel!: TraitViewRef<this, Trait, PanelView> & TimeTableController["panel"];

  @ViewRef({
    extends: true,
    initView(panelView: PanelView): void {
      super.initView(panelView);
      panelView.set({
        style: {
          marginTop: 50,
        },
        unitHeight: 1,
      });
    },
  })
  override readonly tablePanel!: ViewRef<this, PanelView> & TimeTableController["tablePanel"];

  @MapDownlink({
    laneUri: "orders",
    consumed: true,
    keyForm: Form.forString(),
    didUpdate(orderId: string, value: Value): void {

      let orderController = this.owner.getChild(orderId, OrderController);

      if (orderController === null && this.owner.eventKey === value.get("status").get("eventName").stringValue("")) {
        orderController = new OrderController();
        orderController.title.setValue(orderId);

        const nameCell = (orderController.nameCell.attachView() as TextCellView);
        const customerId = value.get("customerId").stringValue(null);
        nameCell.content.set(orderId);
        if (customerId !== null) {
          nameCell.hyperlink.setValue({fragment: Uri.path("/", "customer", "/", customerId, "/", "order", "/", orderId, "/").toString(),});
        } 
        orderController.nameCell.insertView();

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