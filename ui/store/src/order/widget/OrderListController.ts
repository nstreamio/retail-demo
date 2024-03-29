// Copyright 2015-2022 Swim.inc
// All rights reserved.

import { PanelView } from "@swim/panel";
import { TimeTableController} from "@nstream/widget";
import {View, ViewRef} from "@swim/view";
import { MapDownlink, ValueDownlink } from "@swim/client";
import { Value } from "@swim/structure";
import { TraitViewRef } from "@swim/controller";
import { Trait } from "@swim/model";
import { ColView, HeaderView, TextColView } from "@swim/table";
import { ColLayout, TableLayout, TableView } from "@swim/table";
import { Uri } from "@swim/uri";
import { Length } from "@swim/math";
import { Look } from "@swim/theme";
import { OrderController } from "./OrderController";
import { OrderStatus, OrderType, EntityStatus } from "../../types";
import { Color } from "@swim/style";
import { OrderTypeChartController } from "./OrderTypeChartController";
import { CumulativeOrdersSectionController } from "./CumulativeOrdersSectionController";
import { ChartView } from "@swim/chart";
import { DateTime } from "@swim/time";
import { Observes } from "@swim/util";
import { Property } from "@swim/component";
import { KanbanBoardController } from "./KanbanBoardController";

/** @public */
export class OrderListController extends TimeTableController {

  readonly eventKey: OrderStatus;

  constructor(key: OrderStatus) {
    super();
    this.setKey(`orderListController-${key}`);
    this.eventKey = key;
  }

  protected override onMount(): void {
    const kbController = this.getAncestor(KanbanBoardController);
    if (kbController) {
      this.focusedCustomerId.bindInlet(kbController.focusedCustomerId);
    }
  }

  @TraitViewRef({
    extends: true,
    initView(panelView: PanelView): void {
      super.initView(panelView);

      // chart stuff first
      this.owner.chartPanel.attachView();
      this.owner.chart.insertView();
      const graphView = this.owner.graph.insertView();
      // add some classes
      this.owner.chartCanvas.view?.classList.add('olc-chart-canvas');
      // add an OrderTypeChartController for each OrderType to this.series
      const orderTypeChartControllerA = this.owner.series.addController(
        new OrderTypeChartController(this.owner.eventKey, OrderType.OrderA),
        null,
        OrderType.OrderA
      );
      orderTypeChartControllerA.plot.insertView(graphView, void 0, void 0, OrderType.OrderA);

      const orderTypeChartControllerB = this.owner.series.addController(
        new OrderTypeChartController(this.owner.eventKey, OrderType.OrderB),
        null,
        OrderType.OrderB
      );
      orderTypeChartControllerB.plot.insertView(graphView, void 0, void 0, OrderType.OrderB);

      const orderTypeChartControllerC = this.owner.series.addController(
        new OrderTypeChartController(this.owner.eventKey, OrderType.OrderC),
        null,
        OrderType.OrderC
      );
      orderTypeChartControllerC.plot.insertView(graphView, void 0, void 0, OrderType.OrderC);

      // then table stuff
      const tablePanel = this.owner.tablePanel.insertView().set({
        unitWidth: 1,
        unitHeight: (this.owner.eventKey === OrderStatus.readyForPickup ? 3 : 5) / 6,
        minFrameHeight: 0,
        minFrameWidth: 0,
        style: {
          margin: 0,
        }
      });
      tablePanel.classList.add('olc-table-panel');
      this.owner.table.insertView();  // Insert the table when we insert this panel
      this.owner.header.insertView();  // Insert the table's header when we insert this panel

      // conditionally insert CumulativeOrdersSectionController
      if (this.owner.eventKey === OrderStatus.readyForPickup) {
        const cumulativeOrdersSectionController = this.owner.appendChild(new CumulativeOrdersSectionController());
        cumulativeOrdersSectionController.panel.insertView(this.owner.panel.attachView()).set({
          unitWidth: 1,
          unitHeight: 2 / 6,
          style: {
            margin: 0,
          },
        });
      }
    },
  })
  override readonly panel!: TraitViewRef<this, Trait, PanelView> & TimeTableController["panel"];

  @Property({
    valueType: String,
    value: '',
  })
  readonly focusedCustomerId!: Property<this, String>;

  @Property({
    valueType: String,
    value: ''
  })
  readonly focusedOrderType!: Property<this, String>;

  @ViewRef({
    viewType: PanelView,
    extends: true,
    initView(chartPanelView): void {
      chartPanelView.set({
        unitWidth: 1,
        unitHeight: 1 / 6,
        minFrameHeight: 200,
        minFrameWidth: 0,
        style: {
          margin: 0,
        },
        classList: ['olc-chart-panel'],
      });
    }
  })
  override readonly chartPanel!: ViewRef<this, PanelView>;

  @ViewRef({
    viewType: ChartView,
    extends: true,
    initView(chartView: ChartView<DateTime, number>): void {
      chartView.setIntrinsic({
        gutterTop: 0,
        gutterRight: 12,
        gutterBottom: 12,
        gutterLeft: 18,
      });
    }
  })
  override readonly chart!: ViewRef<this, ChartView<DateTime, number>> & Observes<ChartView<DateTime, number>>;

  @ViewRef({
    extends: true,
    createView(): HeaderView {
      const headerView = super.createView() as HeaderView;
      this.owner.customerCol.insertView(headerView);
      this.owner.orderTypeCol.insertView(headerView);
      this.owner.timeInProcessingCol.insertView(headerView);
      return headerView;
    },
    initView(headerView: HeaderView): void {
      headerView.node.addEventListener('mouseenter', () => {
        const kbController = this.owner.getAncestor(KanbanBoardController);
        if (kbController) {
            kbController.focusedCustomerId.setValue('');
        } else {
            console.warn('No KanbanBoardController found for some reason!');
        }
      });
    }
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
    initView(tableView: TableView): void {
      tableView.node.addEventListener('mouseleave', () => {
        const kbController = this.owner.getAncestor(KanbanBoardController);
        if (kbController) {
            kbController.focusedCustomerId.setValue('');
        } else {
            console.warn('No KanbanBoardController found for some reason!');
        }
      });
    }
  })
  override readonly table!: ViewRef<this, TableView> & TimeTableController["table"];

  @ViewRef({
    viewType: ColView,
    viewKey: "customer",
    get parentView(): View | null {
      return this.owner.header.attachView();
    },
    createView(): ColView {
      const textView = TextColView.create().set({
        label: "Customer",
        style: {
          fontWeight: "500",
        }
      });

      return textView;
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
      const textView = TextColView.create().set({
        label: "Order Type",
        style: {
          fontWeight: "500",
        }
      });

      return textView;
    },
  })
  readonly orderTypeCol!: ViewRef<this, ColView>;

  @ViewRef({
    viewType: ColView,
    viewKey: "timeInProcessing",
    get parentView(): View | null {
      return this.owner.header.attachView();
    },
    createView(): ColView {
      const textView = TextColView.create().set({
        label: "Time In Processing",
        style: {
          fontWeight: "500",
        }
      });

      return textView;
    },
  })
  readonly timeInProcessingCol!: ViewRef<this, ColView>;

  @MapDownlink({
    laneUri: "orders",
    inherits: true,
    consumed: true,
    keyForm: Uri.form(),
    didUpdate(nodeUri: Uri, value: Value): void {
      let orderController = this.owner.getChild(nodeUri.pathName, OrderController);
      let orderStatus = value.get("status").stringValue("");
      
      if (orderController === null && this.owner.eventKey === orderStatus) {
        // create new OrderController (row in list)
        orderController = new OrderController(nodeUri.toString(), this.owner.eventKey, this.owner);

        // insert leaf of OrderController (row)
        orderController.leaf.insertView().set({
          style: {
            cursor: 'pointer',
          }
        });

        // insert cells into row
        orderController.customerCell.insertView();
        orderController.orderTypeCell.insertView();
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

  @ValueDownlink({
    laneUri: 'status',
    inherits: true,
    consumed: true,
    didSet(value: Value): void {
      const entityStatus = OrderListController.parseOrdersStatus(value);
     
      // get orderTypeChartController out of this.owner.children or this.series.controllers
      [OrderType.OrderA, OrderType.OrderB, OrderType.OrderC].forEach(t => {
        const orderTypeChartController = this.owner.getChild(t, OrderTypeChartController);
        if (orderTypeChartController !== null) {
          // call .stats() on typeChartController
          orderTypeChartController.stats(entityStatus);
        } else {
          console.log('orderTypeChartController is null for some reason!');
        }
      })
    }
  })
  readonly statusDownlink!: ValueDownlink<this>;

  static parseOrdersStatus(value: Value): EntityStatus {
    const v = value.get('orders');
    return [OrderStatus.orderPlaced, OrderStatus.orderProcessed, OrderStatus.readyForPickup, OrderStatus.pickupCompleted].reduce((acc, s) => {
      [OrderType.OrderA, OrderType.OrderB, OrderType.OrderC].forEach(t => {
        let count = v.get(s).get(t).numberValue(0);
        let value = count * OrderListController.valuePerOrderType[t];
        if (!acc[s]) { acc[s] = { total: { count: 0, value: 0 } } as EntityStatus[OrderStatus]; }
        acc[s][t] = { count, value };
        acc[s].total.count += count;
        acc[s].total.value += value;
      });
      return acc;
    }, {} as EntityStatus);
  };

  static parseProcessedOrders(value: Value): EntityStatus {
    const v = value.get('pickedUpOrders');
    return [OrderStatus.pickupCompleted].reduce((acc, s) => {
      [OrderType.OrderA, OrderType.OrderB, OrderType.OrderC].forEach(t => {
        let count = v.get(t).numberValue(0);
        let value = count * OrderListController.valuePerOrderType[t];
        if (!acc[s]) { acc[s] = { total: { count: 0, value: 0 } } as EntityStatus[OrderStatus]; }
        acc[s][t] = { count, value };
        acc[s].total.count += count;
        acc[s].total.value += value;
      });
      return acc;
    }, {} as EntityStatus);
  };

  private static valuePerOrderType: Record<OrderType, number> = {
    [OrderType.OrderA]: 10,
    [OrderType.OrderB]: 20,
    [OrderType.OrderC]: 30,
    [OrderType.Unknown]: 0,
  };

  private static plotStrokes: Record<OrderType, Color> = {
    [OrderType.OrderA]: Color.parse('#00EE11'),
    [OrderType.OrderB]: Color.parse('#DD2200'),
    [OrderType.OrderC]: Color.parse('#0000FF'),
    [OrderType.Unknown]: Color.parse('#FFFFFF'),
  }
}
