// import { SheetView } from "@swim/sheet";
// import { BoardView } from "@swim/panel";
import { BoardController } from "@swim/panel";
// import { PanelView } from "@swim/panel";
import { Property } from "@swim/component";
// import { TraitViewRef } from "@swim/controller";
// import { Trait } from "@swim/model";
import { View, ViewRef } from "@swim/view";
// import { ButtonStack } from "@swim/button";
import { HtmlView } from "@swim/dom";
import { ControllerRef } from "@swim/controller";
// import { TextView } from "@swim/dom";
import { MainController } from "./MainController";
import { HtmlIconView, VectorIcon } from "@swim/graphics";

export class CustomerController extends BoardController {
  constructor() {
    console.log("constructor of CustomerController");
    super();

    // set customerId
    const customerId = (/(?<=\/customer\/)[^\s!?\/.*#|]+(?=\/|$|\?)/gm.exec(
      window.location.href
    ) ?? [""])[0];
    this.customerId.set(customerId);

    // render view
    console.log("calling initBoard from constructor");
    // insert appBar view
    this.initBoard();

    // insert main view
    this.mainController.controller?.sheet.insertView(this.sheet.attachView());

    // this.hostUri.set("warp://localhost:9001");
    // console.log("this.hostUri.value: ", this.hostUri.value);

    // this.nodeUri.set("customer/" + customerId);
    // console.log("this.nodeUri.value: ", this.nodeUri.value);

    // console.log("this (inside constructor): ", this);
  }

  protected initBoard() {
    console.log("initBoard of CustomerController");
    const boardView = this.sheet.attachView().set({
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "flex-start",
        boxSizing: "border-box",
      },
    });
    this.appBarView.insertView(boardView);
    this.mainController.attachController();
    // const outerPanelView = boardView.appendChild(PanelView).set({
    //   margin,
    // });
  }

  // repeated in MainController; not very DRY; there's probably a way to connect these values
  @Property({
    valueType: String,
    value: "",
  })
  readonly customerId!: Property<this, string>;

  @ViewRef({
    viewType: HtmlView,
    createView() {
      const nav = document.createElement("nav");
      nav.classList.add("cams-nav");
      nav.style.backgroundColor = "#181818";
      return new HtmlView(nav).set({
        style: {
          width: "100%",
          height: "80px",
          flexGrow: 0,
          flexShrink: 0,
          flexBasis: "auto",
          boxSizing: "border-box",
          padding: "16px",
        },
      });
    },
    initView(appBarView: HtmlView): void {
      console.log("appBarView initView");

      const container = appBarView.appendChild("div").set({
        style: {
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "row",
          justifyContent: "flex-start",
          alignItems: "flex-start",
          boxSizing: "border-box",
        },
      });
      // insert NStream logo icon
      container.insertChild(HtmlIconView, null, "nStreamIcon").setIntrinsic({
        graphics: VectorIcon.create(
          64,
          64,
          "M0,0H64V64H0Z M5,5V59H59V5Z M44,38.78V46L25,29.55V46H20V18Z M39,25V18H44V29.33Z"
        ),
        style: {
          width: "48px",
          height: "48px",
          marginRight: "16px",
        },
        classList: ["n-stream-icon"],
      });

      // insert details container
      const detailsContainer = container
        .appendChild("div", "app-bar-details-container")
        .setIntrinsic({
          style: {
            height: "100%",
            display: "flex",
            flexDirection: "column",
            flexBasis: "0px",
            flexGrow: 1,
            flexShrink: 1,
            justifyContent: "space-between",
            alignItems: "flex-start",
          },
        });

      // insert NStream title text
      const title = detailsContainer.appendChild("h1").set({
        style: {
          width: "auto",
          fontWeight: "600",
          fontSize: "20px",
          lineHeight: "24px",
          color: "#FFFFFF",
          margin: "0px",
          boxSizing: "border-box",
        },
      });
      title.node.innerText = "NStream - Retail 360";

      const detailsInnerContainer = detailsContainer.appendChild("div").set({
        style: {
          width: "100%",
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          boxSizing: "border-box",
        },
        classList: ["details-inner-container"],
      });
      // insert NStream subtitle text
      const subtitle = detailsInnerContainer.appendChild("p").set({
        style: {
          fontWeight: "400",
          fontSize: "16px",
          lineHeight: "17px",
          color: "#FFFFFF",
          boxSizing: "border-box",
          margin: "0px",
        },
      });
      subtitle.node.innerText = "1.0.0b";

      // insert customer ID (i.e. "/cam" or "/will")
      const customerNodeName = detailsInnerContainer.appendChild("p").set({
        style: {
          fontWeight: "400",
          fontSize: "16px",
          lineHeight: "17px",
          color: "#FFFFFF",
          margin: "0px",
          boxSizing: "border-box",
        },
      });
      customerNodeName.node.innerText = `/${this.owner.customerId.value}`; // I feel like I need to bind this text to the value of this.owner.customerId somehow. bindInlet?

      // insert container for generic user img icon
      const rightAppBarContainer = container.appendChild("div").setIntrinsic({
        style: {
          height: "100%",
          display: "flex",
          justifyContent: "flex-start",
          alignItems: "flex-end",
        },
        classList: ["right-app-bar-container"],
      });
      // insert generic user img icon
      rightAppBarContainer
        .insertChild(HtmlIconView, null, "user-img-icon")
        .setIntrinsic({
          graphics: VectorIcon.create(
            24,
            24,
            "M12,2 C6.48,2 2,6.48 2,12 C2,17.52 6.48,22 12,22 C17.52,22 22,17.52 22,12 C22,6.48 17.52,2 12,2 Z M12,6 C13.93,6 15.5,7.57 15.5,9.5 C15.5,11.43 13.93,13 12,13 C10.07,13 8.5,11.43 8.5,9.5 C8.5,7.57 10.07,6 12,6 Z M12,20 C9.97,20 7.57,19.18 5.86,17.12 C7.55,15.8 9.68,15 12,15 C14.32,15 16.45,15.8 18.14,17.12 C16.43,19.18 14.03,20 12,20 Z"
          ),
          style: {
            width: "36px",
            height: "36px",
            marginLeft: "2px",
          },
          classList: ["user-img-icon"],
        });
    },
  })
  readonly appBarView!: ViewRef<this, View>;

  @ControllerRef({
    controllerType: MainController,
    controllerKey: "body",
    didMount() {
      // console.log("didMount");
    },
    didAttachController(controller, target) {
      // console.log("didAttachController");
      // console.log("controller: ", controller);
      // console.log("target: ", target);
    },
  })
  readonly mainController!: ControllerRef<
    this,
    MainController,
    [MainController]
  >;

  // @ViewRef({
  //   viewType: TextView,
  //   createView(): TextView {
  //     const textView = new TextView(new Text(""));
  //     return textView;
  //   },
  // })
  // readonly customerIdTextView!: ViewRef<this, TextView>;

  // @ViewRef({
  //   viewType: View, // placeholder
  //   createView(): View {
  //     return View.create(); // placeholder
  //   },
  // })
  // readonly ordersTable!: ViewRef<this, View>;

  // @ViewRef({
  //   viewType: ButtonStack,
  //   createView(): ButtonStack {
  //     return ButtonStack.create(); // placeholder
  //   },
  //   // some event handler which conditionally creates an order via the customer node's downlink to the orders lane
  // })
  // readonly fab!: ViewRef<this, ButtonStack>;

  // @MapDownlink({
  //   laneUri: "status",
  //   consumed: true,
  //   keyForm: Uri.form(),
  //   didConnect(): void {
  //     console.log("status downlink did connect");
  //   },
  //   didUpdate(firstArg, secondArg): void {
  //     console.log("Customer status did update");
  //     console.log("firstStatusArg: ", firstArg);
  //     console.log("secondStatusArg: ", secondArg);
  //   },
  // })
  // readonly statusMapDownlink!: MapDownlink<this, Uri, Value>;
}
