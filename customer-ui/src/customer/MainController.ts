import { Property } from "@swim/component";
import { BoardController, BoardView } from "@swim/panel";
import { ControllerRef, TraitViewRef } from "@swim/controller";
import { Trait } from "@swim/model";
import { ViewRef } from "@swim/view";
import { HtmlView } from "@swim/dom";
import { PanelView } from "@swim/panel";
import { OrderListController } from "./OrderListController";
import { ButtonItem, ButtonStack, ButtonStackObserver, FloatingButton } from "@swim/button";
import {
  HtmlIconView,
  PolygonIcon,
  VectorIcon,
} from "@swim/graphics";
import { MapDownlink, ValueDownlink } from "@swim/client";
import { Uri } from "@swim/uri";
import { Value } from "@swim/structure";
import { Transform } from "@swim/math";
import { OrderStatus, OrderType } from "../types";
import { TimeSeriesController } from "@swim/widget";
import { Observes } from "@swim/util";

export class MainController extends BoardController {
  static readonly MAIN_PANEL_KEY: string = "mainPanelView";
  static readonly ORDER_LIST_CONTROLLER_KEY: string = "orderListController";

  constructor() {
    super();

    const boardView = this.sheet.attachView();
    boardView.appendChild(PanelView, MainController.MAIN_PANEL_KEY);

    // set customerId
    const customerId = (/(?<=\/customer\/)[^\s!?\/.*#|]+(?=\/|$|\?)/gm.exec(
      window.location.href
    ) ?? [""])[0];
    this.customerId.set(customerId);

    const hostUri = 'warp://localhost:9001';
    const nodeUri = `/customer/${this.customerId.value}`;

    // set up and open orders downlink
    this.placeOrderDownlink.setHostUri(hostUri);
    this.placeOrderDownlink.setNodeUri(nodeUri);
    this.placeOrderDownlink.open();

    // set up and open status downlink
    this.statusDownlink.setHostUri(hostUri);
    this.statusDownlink.setNodeUri(nodeUri);
    this.statusDownlink.open();

    // attach controller but don't insert any of its views
    this.orderListController.attachController(new OrderListController(MainController.ORDER_LIST_CONTROLLER_KEY));
  }

  // repeated from CustomerController; not very DRY; there's probably a way to connect these values
  @Property({
    valueType: String,
    value: "",
  })
  readonly customerId!: Property<this, string>;

  @Property({
    valueType: Number,
    value: void 0,
    extends: true,
    binds: true,
    didSetValue(newValue = 0, oldValue) {
      const panelView = this.owner.sheet.attachView().getChild(MainController.MAIN_PANEL_KEY);

      if (newValue > 0 && (oldValue === void 0 || oldValue === 0) && panelView) {
        // remove empty state
        this.owner.emptyState.removeView();

        // insert orders table
        this.owner.orderListController.controller?.panel.insertView(
          panelView,
          void 0,
          void 0,
          MainController.ORDER_LIST_CONTROLLER_KEY
        ).set({
          unitWidth: 1,
          unitHeight: 1,
        });
      } else if (newValue === 0 && (oldValue === void 0 || oldValue > 0) && panelView) {
        // remove orders table
        panelView.removeChild(MainController.ORDER_LIST_CONTROLLER_KEY);

        // insert empty state
        this.owner.emptyState.insertView(panelView).set({
          classList: ['empty-state-view']
        });
      }
    }
  })
  readonly inFlightCount!: Property<this, number | undefined>;

  @Property({
    valueType: Boolean,
    value: undefined,
    binds: true,
    extends: true,
    didSetValue(value: Boolean, oldValue: Boolean | undefined = false): void {
      const boardView = this.owner.sheet.attachView();

      if (value) {
        // remove placeOrderFab
        this.owner.placeOrderFab.removeView();
        // insert pickupOrdersFab
        this.owner.pickupOrdersFab.insertView(boardView);
      } else {
        // remove pickupOrdersFab
        this.owner.pickupOrdersFab.removeView();
        // insert placeOrerFab
        this.owner.placeOrderFab.insertView(boardView);
      }
    }
  })
  readonly pickupReady!: Property<this, Boolean | undefined>;

  @TraitViewRef({
    extends: true,
    createView(): BoardView {
      const mainElement = document.createElement("main");
      const boardView = new BoardView(mainElement).set({
        style: {
          width: "100%",
          flexGrow: 1,
          flexShrink: 1,
          flexBasis: "0px",
          margin: "0px",
          backgroundColor: '#212121',
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
        }
      });

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
        classList: ['empty-state-svg', 'svg', 'yellow'],
      });

      // append square svg
      svgContainerView.appendChild(HtmlIconView, 'square').set({
        graphics: VectorIcon.create(24, 24, 'M2,2L22,2L22,22L2,22Z'),
        style: {
          width: '40px',
          height: '40px',
          marginRight:'24px',
        },
        classList: ['empty-state-svg', 'svg', 'yellow'],
      });

      // append circle svg
      svgContainerView.appendChild(HtmlIconView, 'circle').set({
        graphics: PolygonIcon.create(999),
        style: {
          width: '40px',
          height: '40px',
        },
        classList: ['empty-state-svg', 'svg', 'yellow'],
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
      const circleLabel = circle.insertChild(HtmlView, null, "label").set({
        style: {
          height: '24px',
          lineHeight: '24px',
          paddingTop: '2px',
          paddingBottom: '2px',
          paddingLeft: '4px',
          paddingRight: '4px',
          backgroundColor: 'rgba(33, 33, 33, 0.8)',
          borderRadius: '4px',
          boxShadow: '0px 0px 4px rgba(33, 33, 33, 0.8)',
        },
        classList: ['button-label', 'circle-label'],
      });
      circleLabel.node.innerText = "Order C: $30.00";
      const circleButton = circle.button;
      circleButton?.icon.push(
        PolygonIcon.create(999),
        false
      ).set({
        style: {
          width: '24px',
          height: '24px',
          left: '8px',
          top: '8px',
        },
        iconLayout: {width: 24, height: 24},
      });
      circle.addEventListener("click", handleClick(OrderType.OrderC));

      /* square icon button */
      const square: ButtonItem = buttonStackView.appendChild(
        ButtonItem,
        "square"
      );
      square.button?.style.backgroundColor.set('#F8D260');
      const squareLabel = square.insertChild(HtmlView, null, "label").set({
        style: {
          height: '24px',
          lineHeight: '24px',
          paddingTop: '2px',
          paddingBottom: '2px',
          paddingLeft: '4px',
          paddingRight: '4px',
          backgroundColor: 'rgba(33, 33, 33, 0.8)',
          borderRadius: '4px',
          boxShadow: '0px 0px 4px rgba(33, 33, 33, 0.8)',
        },
        classList: ['button-label', 'circle-label'],
      });
      squareLabel.node.innerText = "Order B: $20.00";
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
      const triangleLabel = triangle.insertChild(HtmlView, null, "label").set({
        style: {
          height: '24px',
          lineHeight: '24px',
          paddingTop: '4px',
          paddingBottom: '4px',
          paddingLeft: '6px',
          paddingRight: '6px',
          backgroundColor: 'rgba(33, 33, 33, 0.8)',
          borderRadius: '4px',
          boxShadow: '0px 0px 4px rgba(33, 33, 33, 0.8)',
        },
        classList: ['button-label', 'circle-label'],
      });
      triangleLabel.node.innerText = "Order A: $10.00";
      triangle.addEventListener("click", handleClick(OrderType.OrderA));
      triangle.button?.icon.push(
        VectorIcon.create(24, 24, "M12,2L22,22L2,22Z"),
        false
      );

      return buttonStackView;
    },
    initView(buttonStackView: ButtonStack): void {
      buttonStackView.node.addEventListener('click', () => {
        buttonStackView.presence.toggle();
      });
    },
  })
  readonly placeOrderFab!: ViewRef<this, ButtonStack> & Observes<ButtonStackObserver>;

  @ViewRef({
    viewType: FloatingButton,
    createView() {
      const fab: FloatingButton = super.createView().set({
        style: {
          position: "absolute",
          bottom: "24px",
          right: "24px",
          width: '56px',
          height: '56px',
          overflow: 'unset',
        },
        classList: ['pickup-orders-fab-button'],
      });
      fab.style.backgroundColor.set('#66FFDD');
      fab.icon.attachView();
      fab.icon.push(VectorIcon.create(
        24,
        24,
        'M5,8L5,19L19,19L19,8L16,8L16,16L12,14L8,16L8,8L5,8ZM5,21C4.45,21,3.98,20.8,3.59,20.41C3.2,20.02,3,19.55,3,19L3,6.53C3,6.29,3.04,6.07,3.11,5.85C3.19,5.63,3.3,5.43,3.45,5.25L4.7,3.73C4.88,3.49,5.11,3.31,5.39,3.19C5.66,3.06,5.95,3,6.25,3L17.75,3C18.05,3,18.34,3.06,18.61,3.19C18.89,3.31,19.12,3.49,19.3,3.73L20.55,5.25C20.7,5.43,20.81,5.63,20.89,5.85C20.96,6.07,21,6.29,21,6.53L21,19C21,19.55,20.8,20.02,20.41,20.41C20.02,20.8,19.55,21,19,21L5,21ZM5.4,6L18.6,6L17.75,5L6.25,5L5.4,6ZM10,8L10,12.75L12,11.75L14,12.75L14,8L10,8ZM5,8.04L19,8.04L5,8.04Z'
      ), false);
      fab.icon.view?.set({
        style: {
          transform: Transform.parse("scale(1.5,1.5)"),
        },
        classList: ['svg', 'black'],
      });

      const that: MainController = this.owner;
      fab.addEventListener('click', function() {
        that.pickUpAllOrders();
      })

      // helper text
      const helperText = fab.insertChild('p', null).set({
        style: {
          position: 'absolute',
          bottom: '34px',
          right: '35px',
          width: '200px',
          color: '#66FFDD',
          fontSize: '20px',
          fontWeight: '400',
          lineHeight: '27px',
        },
        classList: ['pickup-orders-helper-text']
      });
      helperText.node.innerText = (
        `Tap the button below
        to pick up orders!`
      );

      return fab;
    }
  })
  readonly pickupOrdersFab!: ViewRef<this, FloatingButton>;

  @ControllerRef({
    controllerType: OrderListController,
  })
  readonly orderListController!: ControllerRef<this, OrderListController>;

  @ValueDownlink({
    hostUri: 'warp://localhost:9001',
    laneUri: 'status',
    consumed: true,
    didSet(value: Value): void {
      // propagate new value of inFlightCount
      const orderCount = value.get('orderCount').numberValue() ?? 0;
      const pickupCompleted = value.get('orderStates').get(OrderStatus.pickupCompleted).numberValue() ?? 0;
      const newInFlightCount = orderCount - pickupCompleted;
      this.owner.inFlightCount.set(newInFlightCount);

      // propagate new value of pickupReady
      const orderPlaced = value.get('orderStates').get(OrderStatus.orderPlaced).numberValue() ?? 0;
      const orderProcessed = value.get('orderStates').get(OrderStatus.orderProcessed).numberValue() ?? 0;
      const readyForPickup = value.get('orderStates').get(OrderStatus.readyForPickup).numberValue() ?? 0;
      const newPickupReadyValue = orderPlaced === 0 && orderProcessed === 0 && readyForPickup > 0
      this.owner.pickupReady.set(newPickupReadyValue);
    },
  })
  readonly statusDownlink!: ValueDownlink<this>;

  @MapDownlink({
    laneUri: "placeOrder",
    consumed: true,
    keyForm: Uri.form(),
  })
  readonly placeOrderDownlink!: MapDownlink<this, Uri, Value>;

  @MapDownlink({
    hostUri: 'warp://localhost:9001',
    laneUri: 'updateOrder',
    consumed: true,
    keyForm: Uri.form(),
  })
  readonly updateOrderDownlink!: MapDownlink<this, Uri, Value>;

  protected createOrder(orderType: OrderType): void {
    const products = {
      [orderType.charAt(orderType.length - 1)]: 1,
    };
    const status = 'orderPlaced';
    const timestamp = Date.now().valueOf();

    this.placeOrderDownlink.command({
      products,
      status,
      timestamp
    });
  };

  protected pickUpAllOrders(): void {
    Object.values(this.orderListController.controller?.series.controllers ?? {})
      .forEach((controller: TimeSeriesController | undefined) => {
        if (controller === void 0) {
          return;
        }

        this.updateOrderDownlink.setNodeUri(`/order/${controller.key}`);
        this.updateOrderDownlink.open();
        this.updateOrderDownlink.command(`{status:${OrderStatus.pickupCompleted}}`);
        this.updateOrderDownlink.close();
      })
  }
}
