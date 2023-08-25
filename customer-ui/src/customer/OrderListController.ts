import { MapDownlink } from "@swim/client";
import { Property } from "@swim/component";
import { Value } from "@swim/structure";
import { Uri } from "@swim/uri";
import { TimeTableController } from "@swim/widget";
import { OrderController } from "../order";
import { HtmlView } from "@swim/dom";
import { ViewRef } from "@swim/view";
import { ColLayout, TableLayout, TableView, TextCellView } from "@swim/table";
import { TraitViewRef } from "@swim/controller";
import { PanelView } from "@swim/panel";
import { Trait } from "@swim/model";
import { Feel, Look } from "@swim/theme";
import { Length } from "@swim/math";
import { Status } from "@swim/domain";
import { OrderType } from "../types";
import { OrderCellView } from "./OrderCellView";

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
    initView(panelView: PanelView): void {
      panelView.node.classList.add("order-list-controller__panel");
      panelView.style.set({
        margin: "0px",
      });
      super.initView(panelView);
      this.owner.table.insertView(); // Insert the table when we insert this panel
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
    createLayout(): TableLayout {
      const cols = new Array<ColLayout>();
      cols.push(
        ColLayout.create("current", 2, 0, 0, false, false, Look.accentColor)
      );
      cols.push(
        ColLayout.create("name", 2, 0, 0, false, false, Look.accentColor)
      );
      return new TableLayout(null, null, null, Length.px(12), cols);
    },
  })
  override readonly table!: ViewRef<this, TableView> &
    TimeTableController["table"];

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

      const status = value.get("status").stringValue() ?? "unknown";
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

        const currentCell = orderController.currentCell.attachView() as TextCellView;
        currentCell.modifyMood(Feel.default, moodStatus!.moodModifier);

        const nameCell = orderController.nameCell.attachView() as TextCellView;
        nameCell.content.set(
          OrderListController.orderStatusDescription.get(status)
        );
        nameCell.modifyMood(Feel.default, moodStatus!.moodModifier);

        // nameCell.modifyMood(Feel.default, Status.alert().moodModifier);
        // nameCell.modifyMood(Feel.default, Status.warning(0.5).moodModifier);
        // Mood is a computed color. View
        /* Status is a range, with two different colors at different ends. It's a normalized scale.
           Apply a value within the range to get a color between the two ends of the color spectrum */

        // If no OrderController is found, create and insert a new one
      } else if (orderController === null) {
        orderController = new OrderController(nodeUri.pathName);
        orderController.title.setValue(nodeUri.pathName);

        let moodStatus = OrderListController.orderStatusMood.get(
          status || "orderPlaced"
        );

        const currentCell = orderController.currentCell.attachView() as TextCellView;
        currentCell.content.set(new OrderCellView(orderType));
        currentCell.modifyMood(Feel.default, moodStatus!.moodModifier);

        const nameCell = orderController.nameCell.attachView() as TextCellView;
        nameCell.content.set(
          OrderListController.orderStatusDescription.get(status)
        );
        nameCell.modifyMood(Feel.default, moodStatus!.moodModifier);
        nameCell.set({
          style: {
            height: '40px',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-end',
          }
        });
        (nameCell.node.firstChild as HTMLElement).style.alignSelf = 'unset';

        // insert the name cell and current cell for each order into the table
        orderController.nameCell.insertView();
        orderController.currentCell.insertView();

        // set row styles
        orderController.row.view?.set({
          style: {
            height: '72px',
          }
        });
        // set leaf styles
        orderController.leaf.view?.set({ style: { height: '40px' } });

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

  private static orderStatusMood: Map<string, Status> = new Map<string, Status>(
    [
      ["orderPlaced", Status.alert()],
      ["orderProcessed", Status.warning()],
      ["readyForPickup", Status.normal()],
      ["unknown", Status.unknown()],
    ]
  );

  private static orderStatusDescription: Map<string, string> = new Map<
    string,
    string
  >([
    ["orderPlaced", "Received by store"],
    ["orderProcessed", "Store is processing order"],
    ["readyForPickup", "Order is ready for pickup!"],
    ["unknown", "Unknown status"],
  ]);
}
