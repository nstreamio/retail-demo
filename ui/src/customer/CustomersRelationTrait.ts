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
      // Create the customer entity
      const customerId = customerTrait.id.value!;
      customerTrait.title.setIntrinsic(customerId);
      customerTrait.nodeUri.setIntrinsic("/customer/" + customerId);
      // Insert the portal (board of widgets) and the ordersRelation (list of orders to navigate to) into the customer entity
      customerTrait.portal.insertModel();
      customerTrait.ordersRelation.insertModel();
    },
    compareTraits(a: CustomerEntityTrait, b: CustomerEntityTrait): number {
      // Sort the customer navigation alphabetically
      return Strings.compare(a.title.value, b.title.value);
    },
  })
  override readonly entities!: TraitModelSet<this, CustomerEntityTrait> & RelationTrait<CustomerEntityTrait>["entities"] & Observes<CustomerEntityTrait>;

  // Open a downlink to the backend to get the map of customers, we can use this to create the navigation list
  // The nodeUri is inferred from the parent (the store)
  @MapDownlink({
    laneUri: "customers",
    keyForm: Form.forString(),
    consumed: true,
    didUpdate(id: string, status: Value): void {
      // If there is a new customer then insert it into the relation/navigation
      let customerTrait = this.owner.entities.get(id);
      if (customerTrait === null) {
        customerTrait = this.owner.entities.createTrait(id);
        customerTrait.nodeUri.set("/customer/" + id); // Calculate and set the nodeUri of the customer entity
        this.owner.entities.addTrait(customerTrait);
      }
    },
    didRemove(id: string, status: Value): void {
      // When a customer is removed in the backend, remove it from the navigation/relation
      this.owner.removeChild(id);
    }
  })
  readonly customers!: MapDownlink<this, string, Value>;
}