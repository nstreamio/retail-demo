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

  @TraitModelRef({
    modelType: Model,
    modelKey: "portal",
    traitType: CustomerAspectTrait,
    traitKey: "aspect",
  })
  readonly portal!: TraitModelRef<this, CustomerAspectTrait>;

  @TraitModelRef({
    modelType: Model,
    modelKey: "orders",
    traitType: OrdersRelationTrait,
    traitKey: "relation",
  })
  readonly ordersRelation!: TraitModelRef<this, OrdersRelationTrait>;

  @Lazy
  static get icon(): Graphics {
    return PolygonIcon.create(3);
  }

}
