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
import {  ColLayout, TableLayout, TableView, TextCellView } from "@swim/table";
import { Uri } from "@swim/uri";
import { Length } from "@swim/math";
import { Feel, Look } from "@swim/theme";
import { Status } from "@swim/domain";

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

  @ViewRef({
    extends: true,
    createLayout(): TableLayout {
      const cols = new Array<ColLayout>();
      cols.push(ColLayout.create("current", 2, 0, 0, false, false, Look.accentColor));
      cols.push(ColLayout.create("name", 2, 0, 0, false, false, Look.accentColor));
      return new TableLayout(null, null, null, Length.px(12), cols);
    },
  })
  override readonly table!: ViewRef<this, TableView> & TimeTableController["table"];


  // Open a downlink to the backend to get the map of orders, we can use this to  populate the order lists
  // The nodeUri of the downlink is inferred from the parent (the customer)
  @MapDownlink({
    laneUri: "orders",
    consumed: true,
    keyForm: Uri.form(),
    didUpdate(nodeUri: Uri, value: Value): void {
      console.log("nodeUri: ", nodeUri);

      let orderController = this.owner.getChild(nodeUri.pathName, OrderController);
      let moodStatus = OrderListController.orderStatusMood.get(this.owner.eventKey);

      // If there is a new order, and the order is the same status that his controller is managing then add it to the list
      if (orderController === null && this.owner.eventKey === value.get("status").stringValue("")) {
        orderController = new OrderController();
        orderController.title.setValue(nodeUri.pathName);

        const nameCell = (orderController.nameCell.attachView() as TextCellView);
        nameCell.content.set(nodeUri.pathName);
        nameCell.modifyMood(Feel.default, moodStatus!.moodModifier);

        const currentCell = (orderController.currentCell.attachView() as TextCellView);
        currentCell.content.set(value.get("customerId").stringValue());
        currentCell.modifyMood(Feel.default, moodStatus!.moodModifier);

        // We only want to insert the name cell and current cell for each order into the table
        orderController.nameCell.insertView();
        orderController.currentCell.insertView();

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

  private static orderStatusMood: Map<String, Status> = new Map<String, Status>([
    ["orderPlaced", Status.alert()],
    ["orderProcessed", Status.warning()],
    ["readyForPickup", Status.normal()]
  ]);



}
