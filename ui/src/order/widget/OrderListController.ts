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

  readonly listTitle: string;
  readonly eventKey: OrderStatus;

  constructor(title: string, key: OrderStatus) {
    super();
    this.listTitle = title;
    this.eventKey = key;
  }

  @TraitViewRef({
    extends: true,
    initView(panelView: PanelView): void {
      super.initView(panelView);
      panelView.headerTitle.set(this.owner.listTitle);
      this.owner.analyticsPanel.insertView(panelView);
      this.owner.table.insertView();  // Insert the table when we insert this panel
      this.owner.header.insertView();  // Insert the table's header when we insert this panel
    },
  })
  override readonly panel!: TraitViewRef<this, Trait, PanelView> & TimeTableController["panel"];

  @ViewRef({
    viewType: PanelView,
    extends: true,
    createView(): PanelView {
      const panelView = PanelView.create().set({
        style: {
          width: '100%',
          height: 'auto',
          marginTop: '30px',
        }
      });

      const div = panelView.insertChild('div', null).set({
        style: {
          width: '100%',
          height: '220px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          verticalAlign: 'center',
          color: '#AAAAAA',
        },
        classList: ['placeholder-analytics-panel'],
      });
      div.node.innerText = 'ANALYTICS PANEL';

      return panelView;
    }
  })
  readonly analyticsPanel!: ViewRef<this, PanelView>;

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


  // Open a downlink to the backend to get the map of orders, we can use this to  populate the order lists
  // The nodeUri of the downlink is inferred from the parent (the customer)
  // @MapDownlink({
  //   laneUri: "orders",
  //   consumed: true,
  //   keyForm: Uri.form(),
  //   didUpdate(nodeUri: Uri, value: Value): void {
  //     let orderController = this.owner.getChild(nodeUri.pathName, OrderController);
  //     let moodStatus = OrderListController.orderStatusMood.get(this.owner.eventKey);

  //     // If there is a new order, and the order is the same status that his controller is managing then add it to the list
  //     if (orderController === null && this.owner.eventKey === value.get("status").stringValue("")) {
  //       orderController = new OrderController(nodeUri.pathName, this.owner.eventKey);
  //       orderController.title.setValue(nodeUri.pathName);

  //       const nameCell = (orderController.nameCell.attachView() as TextCellView);
  //       nameCell.content.set(nodeUri.pathName);
  //       nameCell.modifyMood(Feel.default, moodStatus!.moodModifier);

  //       const currentCell = (orderController.currentCell.attachView() as TextCellView);
  //       currentCell.content.set(value.get("customerId").stringValue());
  //       currentCell.modifyMood(Feel.default, moodStatus!.moodModifier);

  //       let orderType: OrderType = OrderType.Unknown;
  //       if (value.get("products").get("A").numberValue() ?? 0) {
  //         orderType = OrderType.OrderA;
  //       } else if (value.get("products").get("B").numberValue() ?? 0) {
  //         orderType = OrderType.OrderB;
  //       } else if (value.get("products").get("C").numberValue() ?? 0) {
  //         orderType = OrderType.OrderC;
  //       }
  //       const orderCell = CellView.create();
  //       orderCell.modifyMood(Feel.default, moodStatus!.moodModifier);
  //       orderCell.node.innerText = `Order ${orderType}`;

  //       // We only want to insert the name cell and current cell for each order into the table
  //       orderController.nameCell.insertView();
  //       orderController.currentCell.insertView();
  //       orderController.cells.insertView(void 0, orderCell, void 0, `order:${nodeUri.pathName}`);
  //       console.log('this.owner.cols: ', this.owner.cols);

  //       this.owner.series.addController(orderController, void 0, nodeUri.pathName);
  //     }  

  //     // If the order status changes to a status this controller is not managing, remove it from this list
  //     if (orderController !== null && this.owner.eventKey !== value.get("status").stringValue("")) {
  //       this.owner.removeChild(nodeUri.pathName);
  //     }
  //   },
  //   didRemove(nodeUri: Uri) {
  //     // When an order is removed in the backend, remove it from the list
  //     this.owner.removeChild(nodeUri.pathName);
  //   }
  // })
  // readonly ordersDownlink!: MapDownlink<this, Uri, Value>;
}
