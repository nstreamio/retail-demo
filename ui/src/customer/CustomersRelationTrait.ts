// Copyright 2015-2022 Swim.inc
// All rights reserved.

import {Strings, Observes} from "@swim/util";
import {Form, type Value} from "@swim/structure";
import {MapDownlink} from "@swim/client";
import {TraitModelSet} from "@swim/model";
import {RelationTrait} from "@swim/domain";
import {CustomerEntityTrait} from "./CustomerEntityTrait";

/** @public */
export class CustomersRelationTrait extends RelationTrait<CustomerEntityTrait> {
  constructor() {
    super();
    this.title.setIntrinsic("Customers");
    this.id.setIntrinsic("customer");
  }

  @TraitModelSet({
    extends: true,
    traitType: CustomerEntityTrait,
    observesTrait: true,
    sorted: true,
    initTrait(customerTrait: CustomerEntityTrait): void {
      const customerId = customerTrait.id.value!;
      customerTrait.title.setIntrinsic(customerId);
      customerTrait.nodeUri.setIntrinsic("/customer/" + customerId);
      customerTrait.portal.insertModel();
      customerTrait.ordersRelation.insertModel();
    },
    compareTraits(a: CustomerEntityTrait, b: CustomerEntityTrait): number {
      return Strings.compare(a.title.value, b.title.value);
    },
  })
  override readonly entities!: TraitModelSet<this, CustomerEntityTrait> & RelationTrait<CustomerEntityTrait>["entities"] & Observes<CustomerEntityTrait>;

  @MapDownlink({
    laneUri: "customers",
    keyForm: Form.forString(),
    consumed: true,
    didUpdate(id: string, status: Value): void {
      let customerTrait = this.owner.entities.get(id);
      if (customerTrait === null) {
        customerTrait = this.owner.entities.createTrait(id);
        customerTrait.nodeUri.set("/customer/" + id);
        this.owner.entities.addTrait(customerTrait);
      }
    },
    didRemove(id: string, status: Value): void {
      this.owner.removeChild(id);
    }
  })
  readonly customers!: MapDownlink<this, string, Value>;
}