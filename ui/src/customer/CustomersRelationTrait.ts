// Copyright 2015-2022 Swim.inc
// All rights reserved.

import {Strings, Observes} from "@swim/util";
import {Affinity} from "@swim/component";
import {Form, type Value} from "@swim/structure";
import {MapDownlink} from "@swim/client";
import {TraitModelSet} from "@swim/model";
import {RelationTrait} from "@swim/domain";
import {CustomerEntityTrait} from "./CustomerEntityTrait";

/** @public */
export class CustomersRelationTrait extends RelationTrait {
  constructor() {
    super();
    this.title.setValue("Customers", Affinity.Intrinsic);
  }

  @TraitModelSet<CustomersRelationTrait["entities"]>({
    extends: RelationTrait.entities,
    sorted: true,
    observesTrait: true,
    compareTraits(a: CustomerEntityTrait, b: CustomerEntityTrait): number {
        return Strings.compare(a.title.value, b.title.value);
    },
  })
  override readonly entities!: TraitModelSet<this, CustomerEntityTrait> & RelationTrait["entities"] & Observes<CustomerEntityTrait>;

  @MapDownlink<CustomersRelationTrait["customers"]>({
    laneUri: "customers",
    keyForm: Form.forString(),
    consumed: true,
    didUpdate(name: string, status: Value): void {
      let customerModel = this.owner.getChild(name);
        if (customerModel === null) {
            let customerTrait: CustomerEntityTrait = new CustomerEntityTrait();
            customerTrait.title.setValue(name, Affinity.Intrinsic);
            this.owner.entities.addTrait(customerTrait, void 0, name);
        }
    },
    didRemove(name: string, status: Value): void {
      this.owner.removeChild(name);
    }
  })
  readonly customers!: MapDownlink<this, string, Value>;
}