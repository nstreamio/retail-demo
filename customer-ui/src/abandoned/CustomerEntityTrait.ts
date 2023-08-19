import { EntityTrait, EntityTraitObserver } from "@swim/domain";
import { Model, TraitModelRef } from "@swim/model";
import { CustomerAspectTrait } from "./CustomerAspectTrait";

export interface CustomerEntityTraitObserver<
  T extends CustomerEntityTrait = CustomerEntityTrait
> extends EntityTraitObserver<T> {}

export class CustomerEntityTrait extends EntityTrait {
  constructor() {
    console.log("constructor of CustomerEntityTrait");
    super();
    // what happens if I try to set the hostUri and nodeUri here instead of in index.html?
    this.title.setIntrinsic("Customer Entity");
  }

  @TraitModelRef({
    modelType: Model,
    modelKey: "customer",
    traitType: CustomerAspectTrait,
    traitKey: "aspect",
  })
  readonly portal!: TraitModelRef<this, CustomerAspectTrait>;
}
