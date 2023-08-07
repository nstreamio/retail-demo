// Copyright 2015-2022 Swim.inc
// All rights reserved.

import {PanelView} from "@swim/panel";
import {TimeTableController} from "@swim/widget";
import {ViewRef} from "@swim/view";
import { MapDownlink } from "@swim/client";
import { Value } from "@swim/structure";
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
      this.owner.table.insertView();  // Insert the table when we insert this panel
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

  // Open a downlink to the backend to get the map of orders, we can use this to  populate the order lists
  // The nodeUri of the downlink is inferred from the parent (the customer)
  @MapDownlink({
    laneUri: "orders",
    consumed: true,
    keyForm: Uri.form(),
    didUpdate(nodeUri: Uri, value: Value): void {

      let orderController = this.owner.getChild(nodeUri.pathName, OrderController);

      // If there is a new order, and the order is the same status that his controller is managing then add it to the list
      if (orderController === null && this.owner.eventKey === value.get("status").stringValue("")) {
        orderController = new OrderController();
        orderController.title.setValue(nodeUri.pathName);

        const nameCell = (orderController.nameCell.attachView() as TextCellView);
        const customerId = value.get("customerId").stringValue(null);
        nameCell.content.set(nodeUri.pathName);
        if (customerId !== null) {
          // Add deep link
          nameCell.hyperlink.setValue({fragment: Uri.path("/", "customer", "/", customerId, "/", "order", "/", nodeUri.pathName, "/").toString(),});
        } 
        // We only want to insert the name cell for each order into the table
        orderController.nameCell.insertView();

        this.owner.series.addController(orderController, void 0, nodeUri.pathName);
      }  

      // If the order status changes to a status this controller is not managing, remove it from this list
      if (orderController !== null && this.owner.eventKey !== value.get("status").stringValue("")) {
        this.owner.removeChild(nodeUri.pathName);
      }
    },
    didRemove(nodeUri: Uri) {
      // When an order is removed in the backend, remove it from the list
      this.owner.removeChild(nodeUri.pathName);
    }
  })
  readonly ordersDownlink!: MapDownlink<this, Uri, Value>;





}