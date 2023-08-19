import { AspectTrait } from "@swim/domain";
import { SheetController } from "@swim/sheet";
import { CustomerController } from "../customer/CustomerController";
import { PolygonIcon } from "@swim/graphics";
import { Lazy } from "@swim/util";

export class CustomerAspectTrait extends AspectTrait {
  constructor() {
    console.log("constructor of CustomerAspectTrait");
    super();
    this.id.setIntrinsic("customer");
    this.title.setIntrinsic("Customer");
    this.icon.setIntrinsic(CustomerAspectTrait.icon);
    // no icon needed here since there are no alternative aspects in this folio
  }

  override createTabController(): SheetController | null {
    console.log("createTabController in CustomerAspectTrait");
    return new CustomerController();
  }

  @Lazy
  static get icon(): PolygonIcon {
    return PolygonIcon.create(6);
  }
}
