// import { MapDownlink } from "@swim/client";
import { Property } from "@swim/component";
import { BoardController, BoardView } from "@swim/panel";
// import { Value } from "@swim/structure";
// import { Uri } from "@swim/uri";
import { TraitViewRef } from "@swim/controller";
import { Trait } from "@swim/model";
// import { OrderController } from "../order";
// import { View } from "@swim/view";
import { ViewRef } from "@swim/view";
import { HtmlView } from "@swim/dom";
import { PanelView } from "@swim/panel";
// import { CircleIcon, PolygonIcon } from "@swim/graphics";
import { OrderListController } from "./OrderListController";
import { ButtonItem, ButtonStack } from "@swim/button";
import { CircleIcon, PolygonIcon } from "@swim/graphics";
import { MapDownlink } from "@swim/client";
import { Uri } from "@swim/uri";
import { Value } from "@swim/structure";
// import { CircleIcon, PolygonIcon } from "@swim/graphics";

enum OrderType {
  OrderA = "A",
  OrderB = "B",
  OrderC = "C",
}

export class MainController extends BoardController {
  static readonly EMPTY_STATE_KEY: string = "emptyState";
  static readonly ORDER_LIST_CONTROLLER_KEY: string = "orderListController";

  constructor() {
    super();

    this.initBoard();

    // set customerId
    const customerId = (/(?<=\/customer\/)[^\s!?\/.*#|]+(?=\/|$|\?)/gm.exec(
      window.location.href
    ) ?? [""])[0];
    this.customerId.set(customerId);

    // set up and open orders downlink
    this.ordersDownlink.setHostUri("warp://localhost:9001");
    this.ordersDownlink.setNodeUri(`/customer/${this.customerId.value}`);
    this.ordersDownlink.open();

    // set up and open orders downlink
    this.placeOrderDownlink.setHostUri("warp://localhost:9001");
    this.placeOrderDownlink.setNodeUri(`/customer/${this.customerId.value}`);
    this.placeOrderDownlink.open();
  }

  initBoard() {
    const boardView = this.sheet.attachView();
    const panelView = boardView.appendChild(PanelView);

    // The order kanban board consists of 3 lists of orders (the same except they have different status')
    // Each panel takes up the full height of the sheet and 1/3 of the width
    // We insert each widget by inserting each controller's 'panel'

    const orderPlaceListController = this.appendChild(
      new OrderListController("Orders"),
      MainController.ORDER_LIST_CONTROLLER_KEY
    );
    orderPlaceListController.panel.insertView(panelView).set({
      unitWidth: 1,
      unitHeight: 1,
    });

    // insert fab
    this.fab.insertView(boardView);
  }

  // repeated from CustomerController; not very DRY; there's probably a way to connect these values
  @Property({
    valueType: String,
    value: "",
  })
  readonly customerId!: Property<this, string>;

  @TraitViewRef({
    extends: true,
    createView(): BoardView {
      const mainElement = document.createElement("main");
      mainElement.style.backgroundColor = "#212121";
      mainElement.classList.add("cams-main");
      const boardView = new BoardView(mainElement).set({
        style: {
          width: "100%",
          flexGrow: 1,
          flexShrink: 1,
          flexBasis: "0px",
          margin: "0px",
        },
      });

      return boardView;
    },
  })
  override readonly sheet!: TraitViewRef<this, Trait, BoardView> &
    BoardController["sheet"];

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

  @ViewRef({
    viewType: ButtonStack,
    createView(): ButtonStack {
      const buttonStackView: ButtonStack = super.createView().set({
        style: {
          position: "absolute",
          bottom: "24px",
          right: "24px",
        },
      });
      console.log("buttonStackView: ", buttonStackView);

      const that: ViewRef<MainController, ButtonStack> = this;
      const handleClick = function (orderType: OrderType) {
        return function () {
          that.owner.createOrder(orderType);
        };
      };

      // BUTTONSTACK ONLY OPENS ON LONG PRESS WHEN USING CURSOR; WHAT ABOUT DESKTOP USERS?
      // BUTTONSTACK DOES NOT SHOW ICON AT FIRST
      // BUTTONITEMS DO NOT SHOW ICONS

      const circle: ButtonItem = buttonStackView.appendChild(
        ButtonItem,
        "circle"
      );
      const circleLabel = circle.insertChild(HtmlView, null, "label");
      circleLabel.node.innerText = "Order C";
      circle.addEventListener("click", handleClick(OrderType.OrderC));
      // NO IDEA WHY CIRCLE ICON IS NOT APPEARING. THE PATH ELEMENT WITHIN THE SVG HAS NO WIDTH OR HEIGHT.
      circle.button?.icon.push(CircleIcon.create(), false);
      circle.button?.icon.view?.set({
        style: {
          transform: "translateY(2px) rotate(30deg)",
        },
      });

      const square: ButtonItem = buttonStackView.appendChild(
        ButtonItem,
        "square"
      );
      const squareLabel = square.insertChild(HtmlView, null, "label");
      squareLabel.node.innerText = "Order B";
      square.addEventListener("click", handleClick(OrderType.OrderB));
      square.button?.icon.push(PolygonIcon.create(4), false);

      const triangle: ButtonItem = buttonStackView.appendChild(
        ButtonItem,
        "triangle"
      );
      // ButtonItem.label is getter only. It'd be nice if icon and label had a convenient method for setting.
      const triangleLabel = triangle.insertChild(HtmlView, null, "label");
      triangleLabel.node.innerText = "Order A";
      triangle.addEventListener("click", handleClick(OrderType.OrderA));
      triangle.button?.icon.push(PolygonIcon.create(3), false);

      return buttonStackView;
    },
  })
  readonly fab!: ViewRef<this, ButtonStack>;

  protected createOrder(orderType: OrderType): void {
    console.log(`creating new ${orderType}`);

    // set(key: K | LikeType<K>, newValue: V | LikeType<V>): this;
    this.placeOrderDownlink.set(
      Date.now().valueOf().toString(),
      `{products:{${orderType.charAt(
        orderType.length - 1
      )}:1},status:orderPlaced,timestamp:${Date.now().valueOf()}}`
    );

    // user-initiated message
    // @event(node:"/customer/Customer0",lane:placeOrder)@update(key:"1692381493703")"{products:{A:1},status:orderPlaced,timestamp:1692381493703}"
    // server-initiated message
    // @event(node:"/customer/Customer0",lane:placeOrder){products:{E:2}}

    // @event(
    //   node:"customer/Customer0",
    //   lane:orders
    // )
    // @update(
    //   key:"/order/260d557c-4fc2-4e80-803f-90398cca5c61"
    // ) {
    //   orderId:"260d557c-4fc2-4e80-803f-90398cca5c61",
    //   customerId:Customer0,
    //   products: {
    //     C:2
    //   },
    //   status:pickupCompleted,
    //   timestamp:1692314725184
    // }
  }

  // protected createNewOrderMessage(orderType: OrderType): string {}

  @MapDownlink({
    laneUri: "orders",
    consumed: true,
    keyForm: Uri.form(),
  })
  readonly ordersDownlink!: MapDownlink<this, Uri, Value>;

  @MapDownlink({
    laneUri: "placeOrder",
    consumed: true,
    keyForm: Uri.form(),
  })
  readonly placeOrderDownlink!: MapDownlink<this, Uri, Value>;
}
