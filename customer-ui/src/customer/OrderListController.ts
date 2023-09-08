import { MapDownlink } from "@swim/client";
import { Property } from "@swim/component";
import { Value } from "@swim/structure";
import { Uri } from "@swim/uri";
import { TimeTableController } from "@swim/widget";
import { OrderController } from "../order";
import { HtmlView } from "@swim/dom";
import { View, ViewRef } from "@swim/view";
import { ColLayout, ColView, HeaderView, LeafView, TableLayout, TableView, TextCellView, TextColView } from "@swim/table";
import { TraitViewRef } from "@swim/controller";
import { PanelView } from "@swim/panel";
import { Trait } from "@swim/model";
import { Feel, Look } from "@swim/theme";
import { Length } from "@swim/math";
import { Status } from "@swim/domain";
import { OrderStatus, OrderType } from "../types";
import { HtmlIconView, PolygonIcon, VectorIcon } from "@swim/graphics";
import { Observes } from "@swim/util";

export class OrderListController extends TimeTableController {
  readonly listTitle: string;

  constructor(title: string) {
    super();
    this.listTitle = title;

    // set customerId
    const customerId = (/(?<=\/customer\/)[^\s!?\/.*#|]+(?=\/|$|\?)/gm.exec(
      window.location.href
    ) ?? [""])[0];
    this.customerId.set(customerId);

    // set up and open orders downlink
    this.ordersDownlink.setHostUri("warp://localhost:9001");
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
      this.owner.shapeCol.insertView(headerView);
      this.owner.orderCol.insertView(headerView);
      this.owner.statusCol.insertView(headerView);
      return headerView;
    }
  })
  override readonly header!: ViewRef<this, HeaderView> & TimeTableController["header"];

  @ViewRef({
    extends: true,
    createLayout(): TableLayout {
      const cols = new Array<ColLayout>();
      cols.push(ColLayout.create("shape", 1, 0, 0, false, false, Look.accentColor));
      cols.push(ColLayout.create("order", 2, 0, 0, false, false, Look.accentColor));
      cols.push(ColLayout.create("status", 4, 0, 0, false, false, Look.accentColor));
      return new TableLayout(null, null, null, Length.px(8), cols);
    },
  })
  override readonly table!: ViewRef<this, TableView> &
    TimeTableController["table"];

  @ViewRef({
    viewType: ColView,
    viewKey: "shape",
    extends: true,
    get parentView(): View | null {
      return this.owner.header.attachView();
    },
    createView(): ColView {
      return TextColView.create().set({
        label: "Shape",
      });
    }
  })
  readonly shapeCol!: ViewRef<this, ColView>;

  @ViewRef({
    viewType: ColView,
    viewKey: "order",
    extends: true,
    get parentView(): View | null {
      return this.owner.header.attachView();
    },
    createView(): ColView {
      return TextColView.create().set({
        label: "Order",
      });
    }
  })
  readonly orderCol!: ViewRef<this, ColView>;

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

  // lane: placeOrder BEFORE
  // @event(node:"/customer/cam",lane:placeOrder){products:{C:1},status:orderPlaced,timestamp:1694152466604}
  // lane: placeOrder AFTER
  // @event(node:"/customer/cam",lane:placeOrder){products:{C:1},status:orderPlaced,timestamp:1694153205335}

  // lane: status BEFORE
  // @event(node:"/customer/cam",lane:status){customerId:cam,orderCount:5,timestamp:1694152466609,orderStates:{orderPlaced:5},products:{A:3,B:1,C:1}}
  // lane: status AFTER
  // @event(node:"/customer/cam",lane:status){orderPlaced:{A:3,B:1,C:1}}

  // lane: orders BEFORE
  // @event(node:"/customer/cam",lane:orders)@update(key:"/order/58700262-7835-4686-a8f1-6789dc3c5396"){orderId:"58700262-7835-4686-a8f1-6789dc3c5396",customerId:cam,products:{C:1},status:orderPlaced,timestamp:1694152466609}
  // lane: orders AFTER
  // @event(node:"/customer/cam",lane:orders)@update(key:"/order/657b812b-cc39-4f5f-a175-c244deca6875"){orderId:"657b812b-cc39-4f5f-a175-c244deca6875",customerId:cam,products:{C:1},status:orderPlaced,timestamp:1694153205338}

  @MapDownlink({
    hostUri: "warp://localhost:9001",
    laneUri: "orders",
    consumed: true,
    keyForm: Uri.form(),
    didUpdate(nodeUri: Uri, value: Value): void {
      let orderController = this.owner.getChild(
        nodeUri.pathName,
        OrderController
      );
      console.log('!!orderController: ', !!orderController);

      const status: OrderStatus = (value.get("status").stringValue() ?? "unknown") as OrderStatus;
      console.log('status: ', status);
      let orderType: OrderType = OrderType.Unknown;
      if (value.get("products").get("A").numberValue() ?? 0) {
        orderType = OrderType.OrderA;
      } else if (value.get("products").get("B").numberValue() ?? 0) {
        orderType = OrderType.OrderB;
      } else if (value.get("products").get("C").numberValue() ?? 0) {
        orderType = OrderType.OrderC;
      }
      console.log('orderType: ', orderType);

      if (status === "pickupCompleted") {
        console.log('status was pickupCompleted');
        if (orderController) {
          console.log('removing child 1');
          this.owner.removeChild(nodeUri.pathName);
        }

      // If there is a new order, and the order is the same status that his controller is managing then add it to the list
      } else if (orderController) {
        console.log('existing orderController found');
        let moodStatus = OrderListController.orderStatusMood.get(status);

        const shapeCell = orderController.shapeCell.attachView() as TextCellView;
        ['orange', 'yellow', 'lime', 'teal'].forEach(color => {
          shapeCell.content.view?.node.classList.remove(color);
        });
        shapeCell.content.view?.node.classList.add(OrderListController.getColorFromStatus(status));

        const orderCell = orderController.orderCell.attachView() as TextCellView;
        orderCell.modifyMood(Feel.default, moodStatus!.moodModifier);

        const statusCell = orderController.statusCell.attachView() as TextCellView;
        statusCell.content.set(
          OrderListController.orderStatusDescription.get(status)
        );
        statusCell.modifyMood(Feel.default, moodStatus!.moodModifier);

        // If no OrderController is found, create and insert a new one
      } else if (orderController === null) {
        console.log('no existing orderController found');
        orderController = new OrderController(nodeUri.pathName, orderType);
        orderController.title.setValue(nodeUri.pathName);

        let moodStatus = OrderListController.orderStatusMood.get(
          status || "orderPlaced"
        );

        // set shapeCell of row
        const shapeCell = orderController.shapeCell.attachView() as TextCellView;
        shapeCell.set({
          style: {
            height: '40px',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-end',
          }
        })
        .modifyMood(Feel.default, moodStatus!.moodModifier);
        shapeCell.content.insertView(void 0, this.owner.getOrderShapeSvgView(orderType, status));
        (shapeCell.node.firstChild as HTMLElement).style.alignSelf = 'unset';

        // set orderCell of row
        const orderCell = orderController.orderCell.attachView() as TextCellView;
        orderCell.set({
          style: {
            height: '40px',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-end',
          }
        })
        .modifyMood(Feel.default, moodStatus!.moodModifier);
        orderCell.content.set(`Order ${orderType}`);
        (orderCell.node.firstChild as HTMLElement).style.alignSelf = 'unset';

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
        orderController.shapeCell.insertView();
        orderController.orderCell.insertView();
        orderController.statusCell.insertView();

        // add the OrderController into the series
        console.log('adding the new orderController to the series');
        this.owner.series.addController(
          orderController,
          void 0,
          nodeUri.pathName
        );
      }
    },
  })
  readonly ordersDownlink!: MapDownlink<this, Uri, Value>;

  private getOrderShapeSvgView(orderType: OrderType, status: OrderStatus): HtmlView {
    // define container HtmlView
    const htmlView = HtmlView.create();
    let path: string;
    if (orderType === OrderType.OrderA) {
      path = "M12,2L22,22L2,22Z";
    } else {
      // path for OrderB (square)
      path = "M2,2L22,2L22,22L2,22Z";
    }
    let colorClass: string = OrderListController.getColorFromStatus(status);
    

    // define and insert svg
    const htmlIconView = HtmlIconView.create().setIntrinsic({
      graphics: orderType === OrderType.OrderC ? PolygonIcon.create(999) : VectorIcon.create(
        24,
        24,
        path
      ),
      style: {
        width: "40px",
        height: "40px",
        marginRight: "18px",
        marginBottom: "-2px",
      },
    });
    htmlView.node.classList.add('svg', colorClass);
    htmlView.insertChild(htmlIconView, null);

    return htmlView;
  }

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
