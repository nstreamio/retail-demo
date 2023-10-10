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
import { OrderStatus, OrderType, StoreStatus } from "../types";
import { TimeSeriesController } from "@nstream/widget";
import { Observes } from "@swim/util";

export class MainController extends BoardController {
  static readonly MAIN_PANEL_KEY: string = "mainPanelView";
  static readonly ORDER_LIST_CONTROLLER_KEY: string = "orderListController";

  constructor() {
    super();

    const boardView = this.sheet.attachView();
    boardView.appendChild(PanelView, MainController.MAIN_PANEL_KEY);

    const urlParams = new URLSearchParams(window.location.search);
    
    // set customerId
    const customerId = urlParams.get('customer') || '';
    this.customerId.set(customerId);

    let host = urlParams.get("host");
    const baseUri = Uri.parse(document.location.href);
    if (!host) {
      host = baseUri.base().withScheme(baseUri.schemeName === "https" ? "warps" : "warp").toString();
    }
    const nodeUri = `/customer/${this.customerId.value}`;

    // set up and open orders downlink
    this.placeOrderDownlink.setHostUri(host);
    this.placeOrderDownlink.setNodeUri(nodeUri);
    this.placeOrderDownlink.open();

    // set up and open status downlink
    this.statusDownlink.setHostUri(host);
    this.statusDownlink.setNodeUri(nodeUri);
    this.statusDownlink.open();

    this.updateOrderDownlink.setHostUri(host);

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
  readonly unfulfilledCount!: Property<this, number | undefined>;

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
        // insert placeOrderFab
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

      // text view
      const emptyStatePView = containerView.appendChild("p").set({
        style: {
          fontSize: "20px",
          fontWeight: "400",
          color: MainController.orderStatusColors[OrderStatus.orderPlaced],
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
      buttonStackView.button.view?.style.backgroundColor.set(MainController.orderStatusColors[OrderStatus.orderPlaced]);
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

      /* c icon button */
      const c: ButtonItem = buttonStackView.appendChild(
        ButtonItem,
        "c"
      );
      const cButton = c.button;
      if (cButton) {
        cButton.set({
          style: {
            backgroundColor: MainController.orderStatusColors[OrderStatus.orderPlaced],
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: '22px',
            color: '#000000',
          }
        });
        const text = cButton.appendChild('div').set({
          style: {
            transform: 'translate(-1px,-1px)',
          }
        });
        text.node.innerText = 'C';
      }
      const cLabel = c.insertChild(HtmlView, null, "label").set({
        style: {
          marginTop: '6px',
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
        classList: ['button-label', 'c-label'],
      });
      cLabel.node.innerText = "$30.00";
      c.addEventListener("click", handleClick(OrderType.OrderC));

      /* b icon button */
      const b: ButtonItem = buttonStackView.appendChild(
        ButtonItem,
        "b"
      );
      if (b.button) {
        b.button.set({
          style: {
            backgroundColor: MainController.orderStatusColors[OrderStatus.orderPlaced],
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: '22px',
            color: '#000000',
          }
        });
        const text = b.button.appendChild('div').set({
          style: {
            transform: 'translate(-1px,-1px)',
          }
        });
        text.node.innerText = 'B';
      }
      const bLabel = b.insertChild(HtmlView, null, "label").set({
        style: {
          marginTop: '6px',
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
        classList: ['button-label', 'c-label'],
      });
      bLabel.node.innerText = "$20.00";
      b.addEventListener("click", handleClick(OrderType.OrderB));

      /* a icon button */
      const a: ButtonItem = buttonStackView.appendChild(
        ButtonItem,
        "a"
      );
      if (a.button) {
        a.button.set({
          style: {
            backgroundColor: MainController.orderStatusColors[OrderStatus.orderPlaced],
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: '22px',
            color: '#000000',
          }
        });
        const text = a.button.appendChild('div').set({
          style: {
            transform: 'translate(-1px,-1px)',
          }
        });
        text.node.innerText = 'A';
      }
      const aLabel = a.insertChild(HtmlView, null, "label").set({
        style: {
          marginTop: '4px',
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
        classList: ['button-label', 'c-label'],
      });
      aLabel.node.innerText = "$10.00";
      a.addEventListener("click", handleClick(OrderType.OrderA));

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
          zIndex: 1,
        },
        classList: ['pickup-orders-fab-button'],
      });
      fab.style.backgroundColor.set(MainController.orderStatusColors[OrderStatus.readyForPickup]);
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
          color: MainController.orderStatusColors[OrderStatus.readyForPickup],
          fontSize: '20px',
          fontWeight: '400',
          lineHeight: '27px',
          backgroundColor: 'rgba(33, 33, 33, 0.9)',
          borderRadius: '4px',
          boxShadow: '0px 0px 4px rgba(33, 33, 33, 0.9)',
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
    laneUri: 'status',
    consumed: true,
    didSet(value: Value): void {
      const status = MainController.parseStoreStatus(value);
      // propagate new value of unfulfilledCount
      const newUnfulfilledCount = [
        OrderStatus.orderPlaced,
        OrderStatus.orderProcessed,
        OrderStatus.readyForPickup
      ].reduce((acc, nextStatus: OrderStatus) => acc + status[nextStatus].total.count, 0);
      this.owner.unfulfilledCount.set(newUnfulfilledCount);

      // propagate new value of pickupReady
      const newPickupReadyValue = value.get('notify').booleanValue();
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

  static parseStoreStatus(v: Value): StoreStatus {
    return [OrderStatus.orderPlaced, OrderStatus.orderProcessed, OrderStatus.readyForPickup, OrderStatus.pickupCompleted].reduce((acc, s) => {
      [OrderType.OrderA, OrderType.OrderB, OrderType.OrderC].forEach(t => {
        let count = v.get('orders').get(s).get(t).numberValue(0);
        let value = count * MainController.valuePerOrderType[t];
        if (!acc[s]) { acc[s] = { total: { count: 0, value: 0 } } as StoreStatus[OrderStatus]; }
        acc[s][t] = { count, value };
        acc[s].total.count += count;
        acc[s].total.value += value;
      });
      return acc;
    }, {} as StoreStatus);
  };

  private static valuePerOrderType: Record<OrderType, number> = {
    [OrderType.OrderA]: 10,
    [OrderType.OrderB]: 20,
    [OrderType.OrderC]: 30,
    [OrderType.Unknown]: 0,
  };

  static readonly orderStatusColors: Record<OrderStatus, string> = {
    [OrderStatus.orderPlaced]: '#F7913E',
    [OrderStatus.orderProcessed]: '#F9F070',
    [OrderStatus.readyForPickup]: '#57FAD6',
    [OrderStatus.pickupCompleted]: '#FFFFFF',
  };
}
