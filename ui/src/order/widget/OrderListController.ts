// Copyright 2015-2022 Swim.inc
// All rights reserved.

import {PanelView} from "@swim/panel";
import {TimeTableController} from "@swim/widget";
import {View, ViewRef} from "@swim/view";
import { MapDownlink } from "@swim/client";
import { Value } from "@swim/structure";
import { TraitViewRef } from "@swim/controller";
import { Trait } from "@swim/model";
import { ColView, HeaderView, TextColView } from "@swim/table";
import { ColLayout, TableLayout, TableView } from "@swim/table";
import { Uri } from "@swim/uri";
import { Length } from "@swim/math";
import { Look } from "@swim/theme";
import { OrderController } from "./OrderController";
import { OrderStatus } from "../../types";

/** @public */
export class OrderListController extends TimeTableController {

  readonly eventKey: OrderStatus;

  constructor(key: OrderStatus) {
    super();
    this.eventKey = key;
  }

  @TraitViewRef({
    extends: true,
    initView(panelView: PanelView): void {
      super.initView(panelView);
      // panelView.headerTitle.set(this.owner.listTitle);
      this.owner.table.insertView();  // Insert the table when we insert this panel
      this.owner.header.insertView();  // Insert the table's header when we insert this panel
    },
  })
  override readonly panel!: TraitViewRef<this, Trait, PanelView> & TimeTableController["panel"];

  @ViewRef({
    extends: true,
    initView(panelView: PanelView): void {
      super.initView(panelView);
      panelView.set({
        style: {
          marginTop: 24,
        },
        unitHeight: 1,
      });
    },
  })
  override readonly tablePanel!: ViewRef<this, PanelView> & TimeTableController["tablePanel"];

  @ViewRef({
    extends: true,
    createView(): HeaderView {
      const headerView = super.createView() as HeaderView;
      this.owner.customerCol.insertView(headerView);
      this.owner.orderCol.insertView(headerView);
      this.owner.timeInProcessingCol.insertView(headerView);
      return headerView;
    },
  })
  override readonly header!: ViewRef<this, HeaderView> & TimeTableController["header"];

  @ViewRef({
    extends: true,
    createLayout(): TableLayout {
      const cols = new Array<ColLayout>();
      cols.push(ColLayout.create("customer", 1, 1, 0, false, false, Look.accentColor));
      cols.push(ColLayout.create("order", 1, 0, 0, false, false, Look.accentColor));
      cols.push(ColLayout.create("timeInProcessing", 0, 0, '124px', false, false, Look.accentColor));
      return new TableLayout(null, null, null, Length.px(12), cols);
    },
  })
  override readonly table!: ViewRef<this, TableView> & TimeTableController["table"];

  @ViewRef({
    viewType: ColView,
    viewKey: "customer",
    get parentView(): View | null {
      return this.owner.header.attachView();
    },
    createView(): ColView {
      return TextColView.create().set({
        label: "Customer",
      });
    },
  })
  readonly customerCol!: ViewRef<this, ColView>;

  @ViewRef({
    viewType: ColView,
    viewKey: "order",
    get parentView(): View | null {
      return this.owner.header.attachView();
    },
    createView(): ColView {
      return TextColView.create().set({
        label: "Order",
      });
    },
  })
  readonly orderCol!: ViewRef<this, ColView>;

  @ViewRef({
    viewType: ColView,
    viewKey: "timeInProcessing",
    get parentView(): View | null {
      return this.owner.header.attachView();
    },
    createView(): ColView {
      return TextColView.create().set({
        label: "Time In Processing",
      });
    },
  })
  readonly timeInProcessingCol!: ViewRef<this, ColView>;


  @MapDownlink({
    laneUri: "orders",
    keyForm: Uri.form(),
    consumed: true,
    didUpdate(nodeUri: Uri, value: Value): void {
      let orderController = this.owner.getChild(nodeUri.pathName, OrderController);
      let orderStatus = value.get("status").stringValue("");
      
      if (orderController === null && this.owner.eventKey === orderStatus) {
        // create new OrderController (row in list)
        orderController = new OrderController(nodeUri.pathName, this.owner.eventKey);
        orderController.nodeUri.set(nodeUri);

        // attach the plot view; not implemented in the controller yet
        orderController.plot.attachView();

        orderController.leaf.insertView().set({
          style: {
            cursor: 'pointer',
          }
        });

        // insert cells into row
        orderController.customerCell.insertView();
        orderController.orderCell.insertView();
        orderController.timeInProcessingCell.insertView();

        // call .stats() method on controller to populate cells
        orderController.stats.set(value);

        // add newly created controller this this.series ControllerSet
        this.owner.series.addController(orderController, null, nodeUri.pathName);
      }
      
      // remove orderController if its status does not fit this column anymore
      if (orderController !== null && this.owner.eventKey !== orderStatus) {
        this.owner.removeChild(nodeUri.pathName);
      }
    },
      didRemove(nodeUri: Uri) {
        // When an order is removed in the backend, remove it from the list
        this.owner.removeChild(nodeUri.pathName);
      }
  })
  readonly orderDownlink!: MapDownlink<this, Uri, Value>;
}
