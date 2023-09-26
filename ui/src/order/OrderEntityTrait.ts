// Copyright 2015-2022 Swim.inc
// All rights reserved.
import {Class, Lazy} from "@swim/util";
import {EntityTrait, EntityTraitObserver} from "@nstream/domain";
import { Graphics, VectorIcon } from "@swim/graphics";
import { Model, TraitModelRef } from "@swim/model";
import { OrderAspectTrait } from "./OrderAspectTrait";

/** @public */
export interface OrderEntityTraitObserver<T extends OrderEntityTrait = OrderEntityTrait> extends EntityTraitObserver<T> {
}

/** @public */
export class OrderEntityTrait extends EntityTrait {
  constructor() {
    super();
    this.icon.setIntrinsic(OrderEntityTrait.icon);
  }

  override readonly observerType?: Class<OrderEntityTraitObserver>;

  // Aspect/Portal trait showing that this entity will have a board of widgets/cards
  @TraitModelRef({
    modelType: Model,
    modelKey: "portal",
    traitType: OrderAspectTrait,
    traitKey: "aspect",
  })
  readonly portal!: TraitModelRef<this, OrderAspectTrait>;

  // The icon of the entity, will be used in the navigation on the left
  @Lazy
  static get icon(): Graphics {
    return VectorIcon.create(24, 24, "M20,2L4,2C3,2,2,2.9,2,4L2,7C2,7.7,2.4,8.3,3,8.7L3,20C3,21.1,4.1,22,5,22L19,22C19.9,22,21,21.1,21,20L21,8.7C21.6,8.3,22,7.7,22,7L22,4C22,2.9,21,2,20,2ZM15,14L9,14L9,12L15,12L15,14ZM20,7L4,7L4,4L20,4L20,7Z");
  }

}
