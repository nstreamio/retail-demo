import { MapDownlink } from "@swim/client";
import { Property } from "@swim/component";
import { Value } from "@swim/structure";
import { Uri } from "@swim/uri";
import { TimeTableController } from "@nstream/widget";
import { OrderController } from "../order";
import { HtmlView } from "@swim/dom";
import { View, ViewRef } from "@swim/view";
import { ColLayout, ColView, HeaderView, LeafView, TableLayout, TableView, TextCellView, TextColView } from "@swim/table";
import { TraitViewRef } from "@swim/controller";
import { PanelView } from "@swim/panel";
import { Trait } from "@swim/model";
import { Feel, Look } from "@swim/theme";
import { Length } from "@swim/math";
import { Status } from "@nstream/domain";
import { OrderStatus, OrderType } from "../types";

export class OrderListController extends TimeTableController {
  readonly listTitle: string;

  constructor(title: string) {
    super();
    this.listTitle = title;

    const urlParams = new URLSearchParams(window.location.search);
    
    // set customerId
    const customerId = urlParams.get('customer') || '';
    this.customerId.set(customerId);

    let host = urlParams.get("host");
    const baseUri = Uri.parse(document.location.href);
    if (!host) {
      host = baseUri.base().withScheme(baseUri.schemeName === "https" ? "warps" : "warp").toString();
    }

    // set up and open orders downlink
    this.ordersDownlink.setHostUri(host);
    this.ordersDownlink.setNodeUri(`/customer/${this.customerId.value}`);
    this.ordersDownlink.open();
  }

  // repeated from CustomerController; not very DRY; there's probably a way to connect these values
  @Property({
    valueType: String,
    value: "",
  })
  readonly customerId!: Property<this, string>;

  @ViewRef({
    viewType: HtmlView,
    createView(): HtmlView {
      const containerEl = document.createElement("div");
      const containerView = HtmlView.fromNode(containerEl).set({
        style: {
          width: "100%",
          height: "auto",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          alignItems: "center",
          margin: "0px",
          marginTop: "80px",
        },
      });

      // iconOuterContainer for holding SVGs
      containerView.appendChild("div").set({
        style: {
          width: "100%",
          height: "auto",
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "flex-start",
          margin: "0px",
        },
      });

      containerView.appendChild("p").set({
        style: {
          margin: "0px",
          fontSize: "20px",
          fontWeight: "400",
          maxWidth: "400px",
          color: "yellow",
        },
      });
      containerView.node.innerText =
        "Tap the (+) button below to add an order!";

      return containerView;
    },
  })
  readonly emptyState!: ViewRef<this, HtmlView>;

  @TraitViewRef({
    extends: true,
    initView(parentPanelView: PanelView): void {
      parentPanelView.node.classList.add("order-list-controller__panel");
      parentPanelView.style.set({
        margin: "0px",
      });

      // init OrderListController's panel
      super.initView(parentPanelView);
      this.owner.table.insertView(); // Insert the table when we insert this panel
      this.owner.header.insertView(); // Insert the table's header when we insert this panel
    },
  })
  override readonly panel!: TraitViewRef<this, Trait, PanelView> &
    TimeTableController["panel"];

  @ViewRef({
    extends: true,
    initView(panelView: PanelView): void {
      super.initView(panelView);
      panelView.node.classList.add("order-list-controller__panel-view");
      panelView.set({
        style: {
          marginTop: 50,
        },
        unitHeight: 1,
      });
    },
  })
  override readonly tablePanel!: ViewRef<this, PanelView> &
    TimeTableController["tablePanel"];

  @ViewRef({
    extends: true,
    createView(): HeaderView {
      const headerView = super.createView() as HeaderView;
      // this.owner.shapeCol.insertView(headerView);
      this.owner.orderTypeCol.insertView(headerView);
      this.owner.statusCol.insertView(headerView);
      return headerView;
    }
  })
  override readonly header!: ViewRef<this, HeaderView> & TimeTableController["header"];

  @ViewRef({
    extends: true,
    createLayout(): TableLayout {
      const cols = new Array<ColLayout>();
      // cols.push(ColLayout.create("shape", 1, 0, 0, false, false, Look.accentColor));
      cols.push(ColLayout.create("order", 2, 0, 0, false, false, Look.accentColor));
      cols.push(ColLayout.create("status", 4, 0, 0, false, false, Look.accentColor));
      return new TableLayout(null, null, null, Length.px(8), cols);
    },
    initView(tableView: TableView): void {
      tableView.set({
        style: {
          marginLeft: '16px',
        }
      })
    }
  })
  override readonly table!: ViewRef<this, TableView> &
    TimeTableController["table"];

  @ViewRef({
    viewType: ColView,
    viewKey: "order",
    extends: true,
    get parentView(): View | null {
      return this.owner.header.attachView();
    },
    createView(): ColView {
      return TextColView.create().set({
        label: "Order Type",
      });
    }
  })
  readonly orderTypeCol!: ViewRef<this, ColView>;

  @ViewRef({
    viewType: ColView,
    viewKey: "status",
    extends: true,
    get parentView(): View | null {
      return this.owner.header.attachView();
    },
    createView(): ColView {
      return TextColView.create().set({
        label: "Status",
      });
    }
  })
  readonly statusCol!: ViewRef<this, ColView>;

  @MapDownlink({
    laneUri: "orders",
    consumed: true,
    keyForm: Uri.form(),
    didUpdate(nodeUri: Uri, value: Value): void {
      let orderController = this.owner.getChild(
        nodeUri.pathName,
        OrderController
      );

      const status: OrderStatus = (value.get("status").stringValue() ?? "unknown") as OrderStatus;
      let orderType: OrderType = OrderType.Unknown;
      if (value.get("products").get("A").numberValue() ?? 0) {
        orderType = OrderType.OrderA;
      } else if (value.get("products").get("B").numberValue() ?? 0) {
        orderType = OrderType.OrderB;
      } else if (value.get("products").get("C").numberValue() ?? 0) {
        orderType = OrderType.OrderC;
      }

      if (status === "pickupCompleted") {
        if (orderController) {
          this.owner.removeChild(nodeUri.pathName);
        }

      // If there is a new order, and the order is the same status that his controller is managing then add it to the list
      } else if (orderController) {
        let moodStatus = OrderListController.orderStatusMood.get(status);

        const orderTypeCell = orderController.orderTypeCell.attachView() as TextCellView;
        orderTypeCell.modifyMood(Feel.default, moodStatus!.moodModifier);

        const statusCell = orderController.statusCell.attachView() as TextCellView;
        statusCell.content.set(
          OrderListController.orderStatusDescription.get(status)
        );
        statusCell.modifyMood(Feel.default, moodStatus!.moodModifier);

        // If no OrderController is found, create and insert a new one
      } else if (orderController === null) {
        orderController = new OrderController(nodeUri.pathName, orderType);
        orderController.title.setValue(nodeUri.pathName);

        let moodStatus = OrderListController.orderStatusMood.get(
          status || "orderPlaced"
        );

        // set orderTypeCell of row
        const orderTypeCell = orderController.orderTypeCell.attachView() as TextCellView;
        orderTypeCell.set({
          style: {
            height: '40px',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-end',
          }
        })
        .modifyMood(Feel.default, moodStatus!.moodModifier);
        orderTypeCell.content.set(orderType);
        (orderTypeCell.node.firstChild as HTMLElement).style.alignSelf = 'unset';

        // set statusCell of row
        const statusCell = orderController.statusCell.attachView() as TextCellView;
        statusCell.set({
          style: {
            height: '40px',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-end',
          }
        })
        .modifyMood(Feel.default, moodStatus!.moodModifier);
        statusCell.content.set(OrderListController.orderStatusDescription.get(status));
        (statusCell.node.firstChild as HTMLElement).style.alignSelf = 'unset';

        // insert the name cell and current cell for each order into the table
        // orderController.shapeCell.insertView();
        orderController.orderTypeCell.insertView();
        orderController.statusCell.insertView();

        // add the OrderController into the series
        this.owner.series.addController(
          orderController,
          void 0,
          nodeUri.pathName
        );
      }
    },
  })
  readonly ordersDownlink!: MapDownlink<this, Uri, Value>;

  private static getColorFromStatus(status: OrderStatus): string {
    if (status === OrderStatus.orderPlaced) {
      return "orange";
    } else if (status === OrderStatus.orderProcessed) {
      return "yellow";
    }
    return "teal";
  }

  private static orderStatusMood: Map<OrderStatus, Status> = new Map<OrderStatus, Status>(
    [
      [OrderStatus.orderPlaced, Status.improving(0, 1, 2, 3, 4)(1.4)],
      [OrderStatus.orderProcessed, Status.improving(0, 1, 2, 3, 4)(2)],
      [OrderStatus.readyForPickup, Status.improving(0, 1, 2, 3, 4)(3)],
      [OrderStatus.pickupCompleted, Status.unknown()],
    ]
  );

  private static orderStatusDescription: Map<OrderStatus, string> = new Map<
    OrderStatus,
    string
  >([
    [OrderStatus.orderPlaced, "Received by store"],
    [OrderStatus.orderProcessed, "Store is processing order"],
    [OrderStatus.readyForPickup, "Order is ready for pickup!"],
    [OrderStatus.pickupCompleted, "Unknown status"],
  ]);
}
