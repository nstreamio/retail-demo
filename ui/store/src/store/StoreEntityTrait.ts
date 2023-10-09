// Copyright 2015-2022 Swim.inc
// All rights reserved.
import {EntityTrait} from "@nstream/domain";
import { Model, TraitModelRef } from "@swim/model";
import { StoreAspectTrait } from "./StoreAspectTrait";
import { CustomersRelationTrait } from "..";

export class StoreEntityTrait extends EntityTrait {
  constructor() {
    super();
    this.title.setIntrinsic("Main Store");
  }

  // Aspect/Portal trait showing that this entity will have a board of widgets/cards
  @TraitModelRef({
    modelType: Model,
    modelKey: "portal",
    traitType: StoreAspectTrait,
    traitKey: "aspect",
  })
  readonly portal!: TraitModelRef<this, StoreAspectTrait>;

  // Relation trait showing that this entity will have a list of customers that can be traversed to on the left
  @TraitModelRef({
    modelType: Model,
    modelKey: "customers",
    traitType: CustomersRelationTrait,
    traitKey: "relation",
  })
  readonly customersRelation!: TraitModelRef<this, CustomersRelationTrait>;

}
