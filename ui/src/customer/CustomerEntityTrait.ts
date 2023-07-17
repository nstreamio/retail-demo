// Copyright 2015-2022 Swim.inc
// All rights reserved.
import {Class, Lazy} from "@swim/util";
import type {SheetController} from "@swim/sheet";
import {ActivityController, EntityTrait} from "@swim/domain";
import type {CustomerEntityTraitObserver} from "./CustomerEntityTraitObserver";
import {CustomerBoardController} from "./CustomerBoardController";
import { Model, TraitModelRef } from "@swim/model";
import { OrdersRelationTrait } from "../order/OrdersRelationTrait";
import { Graphics, PolygonIcon } from "@swim/graphics";
import { Affinity } from "@swim/component";

/** @public */
export class CustomerEntityTrait extends EntityTrait {

  constructor() {
    super();
    this.icon.setValue(CustomerEntityTrait.icon, Affinity.Intrinsic);
  }

  override readonly observerType?: Class<CustomerEntityTraitObserver>;

  @TraitModelRef<CustomerEntityTrait["ordersRelation"]>({
    modelType: Model,
    modelKey: "orders",
    traitType: OrdersRelationTrait,
    traitKey: "relation",
  })
  readonly ordersRelation!: TraitModelRef<this, OrdersRelationTrait>;

  override attachCoverController(coverController: SheetController): void {
    super.attachCoverController(coverController);
    if (coverController instanceof ActivityController) {
      const boardController = new CustomerBoardController();
      coverController.setTab("board", boardController);
    }
  }

  @Lazy
  static get icon(): Graphics {
    return PolygonIcon.create(3);
  }

}
