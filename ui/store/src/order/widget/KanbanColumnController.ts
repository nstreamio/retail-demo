import { Property } from "@swim/component";
import { PanelController } from "@swim/panel";

export class KanbanColumnController extends PanelController {
  constructor() {
    super();
  }

  @Property({
    valueType: String,
    value: ''
  })
  readonly focusedOrderType!: Property<this, String>;
}
