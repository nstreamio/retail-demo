// import { MapDownlink } from "@swim/client";
import { Property } from "@swim/component";
import { BoardController, BoardView } from "@swim/panel";
// import { Value } from "@swim/structure";
// import { Uri } from "@swim/uri";
import { ControllerRef, TraitViewRef } from "@swim/controller";
import { Trait } from "@swim/model";
// import { OrderController } from "../order";
// import { View } from "@swim/view";
import { ViewRef } from "@swim/view";
import { HtmlView } from "@swim/dom";
import { PanelView } from "@swim/panel";
// import { CircleIcon, PolygonIcon } from "@swim/graphics";
import { OrderListController } from "./OrderListController";
import { ButtonItem, ButtonStack } from "@swim/button";
import {
  CircleIcon,
  HtmlIconView,
  // CircleIcon,
  // HtmlIconView,
  // PolygonIcon,
  VectorIcon,
} from "@swim/graphics";
import { MapDownlink } from "@swim/client";
import { Uri } from "@swim/uri";
import { Value } from "@swim/structure";
import { Transform } from "@swim/math";
// import { CircleIcon, PolygonIcon } from "@swim/graphics";

enum OrderType {
  OrderA = "A",
  OrderB = "B",
  OrderC = "C",
}

export class MainController extends BoardController {
  static readonly MAIN_PANEL_KEY: string = "mainPanelView";
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

    this.orderListController.attachController(new OrderListController(MainController.ORDER_LIST_CONTROLLER_KEY));
    this.orderCount.bindInlet(this.orderListController.controller!.ordersDisplayed);
    console.log('this.orderCount.inlet before: ', this.orderCount.inlet);
    console.log('this.orderListController.controller!.ordersDisplayed: ', this.orderListController.controller!.ordersDisplayed);
    console.log('this.orderCount.inlet after: ', this.orderCount.inlet);
  }

  initBoard() {
    const boardView = this.sheet.attachView();
    boardView.appendChild(PanelView, MainController.MAIN_PANEL_KEY);

    // insert fab
    this.fab.insertView(boardView);
  }

  // repeated from CustomerController; not very DRY; there's probably a way to connect these values
  @Property({
    valueType: String,
    value: "",
  })
  readonly customerId!: Property<this, string>;

  @Property({
    valueType: Number,
    extends: true,
    binds: true,
    didBindInlet(inlet) {
        console.log('didBindInlet in MainController.orderCount');
        console.log('inlet: ', inlet);
    },
    willUnmount() {
      console.log('willUnmount!');
    },
    willSetValue() {
      console.log('willSetValue!');
    },
    didSetValue(newValue, oldValue) {
      console.log('didSetValue in MainController.orderCount');
      console.log('newValue: ', newValue);
      console.log('oldValue: ', oldValue);

      const panelView = this.owner.sheet.attachView().getChild(MainController.MAIN_PANEL_KEY);
      console.log('panelView: ', panelView);

      if (newValue > 0 && oldValue === 0 && panelView) {
        console.log('removing empty state and SHOWING ORDERS TABLE');
        // remove empty state
        panelView.removeChild(MainController.EMPTY_STATE_KEY);

        // insert orders table
        this.owner.orderListController.controller?.panel.insertView(panelView).set({
          unitWidth: 1,
          unitHeight: 1,
        });
      } else if (newValue === 0 && (oldValue > 0 || oldValue === void 0) && panelView) {
        console.log('removing orders table and SHOWING EMPTY STATE');
        // remove orders table
        panelView.removeChild(MainController.MAIN_PANEL_KEY);

        // insert empty state
        this.owner.emptyState.insertView(panelView).set({
          classList: ['empty-state-view']
        });
      }
    }
  })
  readonly orderCount!: Property<this, number>;

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
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          margin: "0px",
          marginBottom: '80px',
        },
        classList: ['empty-state-view']
      });
      containerView.setKey(MainController.EMPTY_STATE_KEY);

      // iconOuterContainer for holding SVGs
      const svgContainerView = containerView.appendChild("div").set({
        style: {
          width: "100%",
          height: "auto",
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "flex-start",
          margin: "0px",
        },
        classList: ['empty-state-svg-container']
      });

      // append triangle svg
      svgContainerView.appendChild(HtmlIconView, 'triangle').set({
        graphics: VectorIcon.create(24, 24, 'M12,2L22,22L2,22Z'),
        style: {
          width: '40px',
          height: '40px',
          marginRight:'24px',
        },
        classList: ['empty-state-svg'],
      });

      // append square svg
      svgContainerView.appendChild(HtmlIconView, 'square').set({
        graphics: VectorIcon.create(24, 24, 'M2,2L22,2L22,22L2,22Z'),
        style: {
          width: '40px',
          height: '40px',
          marginRight:'24px',
        },
        classList: ['empty-state-svg'],
      });

      // append circle svg
      svgContainerView.appendChild(HtmlIconView, 'circle').set({
        graphics: CircleIcon.create(),
        style: {
          width: '40px',
          height: '40px',
        },
        classList: ['empty-state-svg'],
      });

      // text view
      const emptyStatePView = containerView.appendChild("p").set({
        style: {
          fontSize: "20px",
          fontWeight: "400",
          color: "#F8D260",
          marginTop: '24px',
          marginRight: '80px',
          marginBottom: "80px",
          marginLeft: '80px',
        },
      });
      emptyStatePView.node.innerText =
        "Tap the (+) button below to add an order!";

      return containerView;
    },
  })
  readonly emptyState!: ViewRef<this, HtmlView>;

  @ControllerRef({
    controllerType: OrderListController,
  })
  readonly orderListController!: ControllerRef<this, OrderListController>;

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
      buttonStackView.button.view?.style.backgroundColor.set('#F8D260');
      buttonStackView.button.attachView().icon.attachView();
      buttonStackView.button.view?.icon.push(VectorIcon.create(24, 24, 'M11,13L5,13L5,11L11,11L11,5L13,5L13,11L19,11L19,13L13,13L13,19L11,19Z'), false);
      buttonStackView.button.view?.set({
        style: {
          width: '100%',
          height: '100%',
        },
        classList: ['button-stack-view'],
      });
      buttonStackView.button.view?.icon.view?.set({
        style: {
          transform: Transform.parse("scale(1.5,1.5)"),
        },
        classList: ['svg-container-view'],
      });

      // icon button handler
      const that: ViewRef<MainController, ButtonStack> = this;
      const handleClick = function (orderType: OrderType) {
        return function () {
          that.owner.createOrder(orderType);
        };
      };

      /* circle icon button */
      const circle: ButtonItem = buttonStackView.appendChild(
        ButtonItem,
        "circle"
      );
      circle.button?.style.backgroundColor.set('#F8D260');
      const circleLabel = circle.insertChild(HtmlView, null, "label");
      circleLabel.node.innerText = "Order C";
      circle.addEventListener("click", handleClick(OrderType.OrderC));
      circle.button?.icon.push(
        CircleIcon.create(),
        false
      );
      circle.button?.icon.view?.set({
        style: {
          width: '24px',
          height: '24px'
        },
        iconLayout: {width: 24, height: 24},
      });

      /* square icon button */
      const square: ButtonItem = buttonStackView.appendChild(
        ButtonItem,
        "square"
      );
      square.button?.style.backgroundColor.set('#F8D260');
      const squareLabel = square.insertChild(HtmlView, null, "label");
      squareLabel.node.innerText = "Order B";
      square.addEventListener("click", handleClick(OrderType.OrderB));
      square.button?.icon.push(
        VectorIcon.create(24, 24, "M2,2L22,2L22,22L2,22Z"),
        false
      );

      /* triangle icon button */
      const triangle: ButtonItem = buttonStackView.appendChild(
        ButtonItem,
        "triangle"
      );
      triangle.button?.style.backgroundColor.set('#F8D260');
      const triangleLabel = triangle.insertChild(HtmlView, null, "label");
      triangleLabel.node.innerText = "Order A";
      triangle.addEventListener("click", handleClick(OrderType.OrderA));
      triangle.button?.icon.push(
        VectorIcon.create(24, 24, "M12,2L22,22L2,22Z"),
        false
      );

      return buttonStackView;
    },
  })
  readonly fab!: ViewRef<this, ButtonStack>;

  protected createOrder(orderType: OrderType): void {
    console.log(`creating new ${orderType}`);

    this.placeOrderDownlink.set(
      Date.now().valueOf().toString(),
      `{products:{${orderType.charAt(
        orderType.length - 1
      )}:1},status:orderPlaced,timestamp:${Date.now().valueOf()}}`
    );
  }

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
