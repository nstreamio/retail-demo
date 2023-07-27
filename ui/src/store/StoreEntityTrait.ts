// Copyright 2015-2022 Swim.inc
// All rights reserved.
import {Class} from "@swim/util";
import {EntityTrait, EntityTraitObserver} from "@swim/domain";
import { CustomersRelationTrait } from "../customer";
import { Model, TraitModelRef } from "@swim/model";
import { StoreAspectTrait } from "./StoreAspectTrait";

/** @public */
export interface StoreEntityTraitObserver<T extends StoreEntityTrait = StoreEntityTrait> extends EntityTraitObserver<T> {
}

/** @public */
export class StoreEntityTrait extends EntityTrait {
  constructor() {
    super();
    this.title.setIntrinsic("Main Store");
  }

  declare readonly observerType?: Class<StoreEntityTraitObserver>;

  @TraitModelRef({
    modelType: Model,
    modelKey: "portal",
    traitType: StoreAspectTrait,
    traitKey: "aspect",
  })
  readonly portal!: TraitModelRef<this, StoreAspectTrait>;

  @TraitModelRef({
    modelType: Model,
    modelKey: "customers",
    traitType: CustomersRelationTrait,
    traitKey: "relation",
  })
  readonly customersRelation!: TraitModelRef<this, CustomersRelationTrait>;

}
