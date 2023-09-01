import { TraitViewRef } from "@swim/controller";
import { PanelController, PanelView } from "@swim/panel";
import { TimeTableController } from "@swim/widget";
import { CumulativeOrdersPanelController } from "./CumulativeOrdersPanelController";
import { OrderType } from "../../types";
import { Trait } from "@swim/model";

export class CumulativeOrdersSectionController extends TimeTableController {
  constructor() {
    super();
  }

  @TraitViewRef({
    extends: true,
    initView(rootPanelView: PanelView): void {
      rootPanelView.set({
        style: {
          paddingTop: '16px',
        }
      });

      const cumulativeOrdersAController = this.owner.appendChild(new CumulativeOrdersPanelController(OrderType.OrderA), `CumulativeOrders${OrderType.OrderA}`);
      cumulativeOrdersAController.panel.insertView(rootPanelView).set({
        unitWidth: 1 / 2,
        unitHeight: 1 / 2,
        style: {
          margin: 0
        }
      });

      const cumulativeOrdersBController = this.owner.appendChild(new CumulativeOrdersPanelController(OrderType.OrderB), `CumulativeOrders${OrderType.OrderB}`);
      cumulativeOrdersBController.panel.insertView(rootPanelView).set({
        unitWidth: 1 / 2,
        unitHeight: 1 / 2,
        style: {
          margin: 0
        }
      });

      const cumulativeOrdersCController = this.owner.appendChild(new CumulativeOrdersPanelController(OrderType.OrderC), `CumulativeOrders${OrderType.OrderC}`);
      cumulativeOrdersCController.panel.insertView(rootPanelView).set({
        unitWidth: 1 / 2,
        unitHeight: 1 / 2,
        style: {
          margin: 0
        }
      });

      const cumulativeOrdersTotalController = this.owner.appendChild(new CumulativeOrdersPanelController(OrderType.Unknown, true), `CumulativeOrdersTotal`);
      cumulativeOrdersTotalController.panel.insertView(rootPanelView).set({
        unitWidth: 1 / 2,
        unitHeight: 1 / 2,
        style: {
          margin: 0
        }
      });
    }
  })
  override readonly panel!: TraitViewRef<this, Trait, PanelView> & TimeTableController['panel'];
}
