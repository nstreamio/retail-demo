import { EntityFolioController } from '@nstream/nstream';
import { HtmlView } from '@swim/dom';
import { CanvasView } from '@swim/graphics';
import { Uri } from '@swim/uri';
import { ViewRef } from '@swim/view';

export class AppEntityFolioController extends EntityFolioController {
  private _host: string | null = null;

  constructor() {
    super();

    const urlParams = new URLSearchParams(window.location.search);
    let host = urlParams.get("host");
    const baseUri = Uri.parse(document.location.href);
    if (!host) {
      host = baseUri.base().withScheme(baseUri.schemeName === "https" ? "warps" : "warp").toString();
    }
    this._host = host;
  }

  protected override didMount(): void {
    super.didMount();

    const body = document.body;

    const that = this;
    const resizeCallback: ResizeObserverCallback = function(entries, observer) {
      const navEl = document.querySelector(".stack > div.sheet");
      if (!navEl) {
        return;
      }

      navEl.appendChild(that.navQrContainer.attachView().node);
    }

    const observer = new ResizeObserver(resizeCallback);

    observer.observe(body);
  }

  @ViewRef({
    viewType: HtmlView,
    createView(): HtmlView {
      return HtmlView.create().set({
        style: {
          position: "sticky",
          top: "unset",
          bottom: "0px",
          left: "0px",
          width: "100%",
          height: "158px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          paddingBottom: "24px",
          paddingTop: "9px",
          zIndex: 1,
          backgroundColor: "#212121",
        }
      });
    },
    initView(view): void {
      const labelEl = document.createElement("p");
      labelEl.innerText = "Store UI";
      const labelView = new HtmlView(labelEl).set ({
        style: {
          fontSize: "14px",
          width: "100%",
          height: "28px",
          marginTop: "8px",
          marginBottom: "8px",
          textAlign: "center"
        }
      })
      view.appendChild(labelView);
      this.owner.qrCanvas.insertView(this.attachView());
    },
  })
  readonly navQrContainer!: ViewRef<this, HtmlView> & { insertToNav: () => void };

  @ViewRef({
    viewType: CanvasView,
    createView(): CanvasView {
      return CanvasView.create().set({
        style: {
          position: "relative",
          top: "unset",
          right: "unset",
          bottom: "unset",
          left: "unset",
        }
      });
    },
    initView(canvasView): void {
      const url = `${window.location.protocol}//${window.location.host}/customer-ui/`;
      window.QRCode.toCanvas(canvasView.node, url);
    },
  })
  readonly qrCanvas!: ViewRef<this, CanvasView> & { insertToNav: () => void };
}
