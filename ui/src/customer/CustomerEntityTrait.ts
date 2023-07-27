// Copyright 2015-2022 Swim.inc
// All rights reserved.
import {Class, Lazy} from "@swim/util";
import {EntityTrait, EntityTraitObserver} from "@swim/domain";
import { Model, TraitModelRef } from "@swim/model";
import { OrdersRelationTrait } from "../order/OrdersRelationTrait";
import { Graphics, PolygonIcon } from "@swim/graphics";
import { CustomerAspectTrait } from "./CustomerAspectTrait";

/** @public */
export interface CustomerEntityTraitObserver<T extends CustomerEntityTrait = CustomerEntityTrait> extends EntityTraitObserver<T> {
}

/** @public */
export class CustomerEntityTrait extends EntityTrait {
  constructor() {
    super();
    this.icon.setIntrinsic(CustomerEntityTrait.icon);
  }

  override readonly observerType?: Class<CustomerEntityTraitObserver>;

  // Aspect/Portal trait showing that this entity will have a board of widgets/cards
  @TraitModelRef({
    modelType: Model,
    modelKey: "portal",
    traitType: CustomerAspectTrait,
    traitKey: "aspect",
  })
  readonly portal!: TraitModelRef<this, CustomerAspectTrait>;

  // Relation trait showing that this entity will have a list of orders that can be traversed to on the left
  @TraitModelRef({
    modelType: Model,
    modelKey: "orders",
    traitType: OrdersRelationTrait,
    traitKey: "relation",
  })
  readonly ordersRelation!: TraitModelRef<this, OrdersRelationTrait>;

  // The icon of the entity, will be used in the navigation on the left
  @Lazy
  static get icon(): Graphics {
    return PolygonIcon.create(3);
  }

}
