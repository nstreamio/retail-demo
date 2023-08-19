import { MapDownlink } from "@swim/client";
import { Property } from "@swim/component";
import { Value } from "@swim/structure";
import { Uri } from "@swim/uri";
import { TimeTableController } from "@swim/widget";
import { OrderController } from "../order";
import { HtmlView } from "@swim/dom";
import { ViewRef } from "@swim/view";
// import { Status } from "@swim/domain";
import { ColLayout, TableLayout, TableView, TextCellView } from "@swim/table";
import { TraitViewRef } from "@swim/controller";
import { PanelView } from "@swim/panel";
import { Trait } from "@swim/model";
import { Feel, Look } from "@swim/theme";
import { Length } from "@swim/math";
import { Status } from "@swim/domain";

// const EMPTY_STATE_KEY = "emptyState";

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

      /*
        HAVING ISSUES HERE, TOO, BECAUSE OF NOT KNOWING HOW TO INSERT SVGs
      */
      // [3, 4, 999].forEach(function(num) {
      //   const iconInnerContainer = iconOuterContainer.appendChild("div").set({
      //     style: {
      //       margin: '0px',
      //       marginLeft: '16px',
      //       marginRight: '16px',
      //     },
      //   });

      //   let icon: View;
      //   if (num > 100) {
      //     icon = CircleIcon.create();
      //   } else {
      //     icon = PolygonIcon.create(num);
      //   }

      //   iconInnerContainer.appendChild(icon);
      //   iconInnerContainer.insertChild(icon);
      //   iconInnerContainer.
      // });

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
      // we don't want a title for this TimeTableController
      // panelView.headerTitle.set(this.owner.listTitle);
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
    didSync() {
      console.log("didSync orders downlink from OrderListController");
    },
    didUpdate(nodeUri: Uri, value: Value): void {
      // console.log("ordersDownlink didUpdate");
      // console.log("nodeUri: ", nodeUri);
      // console.log("value: ", value);
      // const sheetView = this.owner.sheet.attachView();

      // const ordersCount = this.owner.orders.controllerCount;
      // // console.log("ordersCount: ", ordersCount);

      // const emptyStateView = sheetView.getChild(EMPTY_STATE_KEY);
      // // console.log("emptyStateView: ", emptyStateView);
      // // console.log("sheetView: ", sheetView);

      // // if no orders and no emptyStateView exists, insert it
      // if (!ordersCount && !emptyStateView) {
      //   // console.log("inserting emptyStateView");
      //   this.owner.emptyState.insertView(
      //     sheetView,
      //     void 0,
      //     void 0,
      //     EMPTY_STATE_KEY
      //   );
      // } else if (ordersCount && emptyStateView) {
      //   // if orders exist and an emptyStateView exists, remove the emptyStateView
      //   sheetView.removeChild(EMPTY_STATE_KEY);
      //   // RATHER THAN INSERTING AND REMOVING VIEWS, CAN I CREATE A VARIABLE AND JUST REASSIGN DIFFERENT VIEWS TO IT?
      // }

      let orderController = this.owner.getChild(
        nodeUri.pathName,
        OrderController
      );

      // console.log(
      //   `order ${nodeUri.pathName} ${!!orderController ? "found" : "NOT found"}`
      // );
      const status = value.get("status").stringValue();
      // console.log("status: ", status);

      if (status === "pickupCompleted") {
        if (orderController) {
          // console.log("removing new order " + nodeUri.pathName);
          this.owner.removeChild(nodeUri.pathName);
        }

        // If there is a new order, and the order is the same status that his controller is managing then add it to the list
      } else if (orderController) {
        // console.log("update existing order " + nodeUri.pathName);
        // update mood of orderController

        let moodStatus = OrderListController.orderStatusMood.get(
          status || "unknown"
        );

        const nameCell = orderController.nameCell.attachView() as TextCellView;
        nameCell.content.set(
          OrderListController.orderStatusDescription.get(status || "unknown")
        );
        nameCell.modifyMood(Feel.default, moodStatus!.moodModifier);

        const currentCell =
          orderController.currentCell.attachView() as TextCellView;
        currentCell.modifyMood(Feel.default, moodStatus!.moodModifier);
      } else if (orderController === null) {
        // console.log("creating new order " + nodeUri.pathName);
        orderController = new OrderController();
        orderController.title.setValue(nodeUri.pathName);

        let moodStatus = OrderListController.orderStatusMood.get(
          status || "orderPlaced"
        );

        const nameCell = orderController.nameCell.attachView() as TextCellView;
        nameCell.content.set(
          OrderListController.orderStatusDescription.get(status || "unknown")
        );
        nameCell.modifyMood(Feel.default, moodStatus!.moodModifier);

        const currentCell =
          orderController.currentCell.attachView() as TextCellView;
        currentCell.content.set(nodeUri.pathName);
        currentCell.modifyMood(Feel.default, moodStatus!.moodModifier);

        // We only want to insert the name cell and current cell for each order into the table
        orderController.nameCell.insertView();
        orderController.currentCell.insertView();

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
