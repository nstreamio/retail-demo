// Copyright 2015-2022 Swim.inc
// All rights reserved.
import {Class} from "@swim/util";
import type {SheetController} from "@swim/sheet";
import {ActivityController, EntityTrait} from "@swim/domain";
import type {StoreEntityTraitObserver} from "./StoreEntityTraitObserver";
import {StoreBoardController} from "./StoreBoardController";
import { CustomersRelationTrait } from "../customer";
import { Model, TraitModelRef } from "@swim/model";

/** @public */
export class StoreEntityTrait extends EntityTrait {
  constructor() {
    super();
    this.title.setValue("Main Store");
  }

  override readonly observerType?: Class<StoreEntityTraitObserver>;

  @TraitModelRef<StoreEntityTrait["customersRelation"]>({
    modelType: Model,
    modelKey: "machines",
    traitType: CustomersRelationTrait,
    traitKey: "relation",
  })
  readonly customersRelation!: TraitModelRef<this, CustomersRelationTrait>;

  override attachCoverController(coverController: SheetController): void {
    super.attachCoverController(coverController);
    if (coverController instanceof ActivityController) {
      const boardController = new StoreBoardController();
      coverController.setTab("board", boardController);
    }
  }

}
