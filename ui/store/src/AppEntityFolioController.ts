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
        classList: ['qr-container'],
      });
    },
    initView(view): void {
      const labelEl = document.createElement("p");
      labelEl.innerText = "Store UI";
      const labelView = new HtmlView(labelEl).set ({
        classList: ['qr-label'],
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
