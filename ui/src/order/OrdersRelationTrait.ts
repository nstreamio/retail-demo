// Copyright 2015-2022 Swim.inc
// All rights reserved.

import {Form, type Value} from "@swim/structure";
import {MapDownlink} from "@swim/client";
import {RelationTrait} from "@swim/domain";
import {OrderEntityTrait} from "./OrderEntityTrait";
import { Observes, Strings } from "@swim/util";
import { TraitModelSet } from "@swim/model";

/** @public */
export class OrdersRelationTrait extends RelationTrait<OrderEntityTrait> {
  constructor() {
    super();
    this.title.setIntrinsic("Orders");
    this.id.setIntrinsic("order");
  }

  @TraitModelSet({
    extends: true,
    traitType: OrderEntityTrait,
    observesTrait: true,
    sorted: true,
    initTrait(orderTrait: OrderEntityTrait): void {
      // Create the order entity
      const orderId = orderTrait.id.value!;
      orderTrait.title.setIntrinsic(orderId);
      orderTrait.nodeUri.setIntrinsic("/order/" + orderId);
      // Insert the portal (board of widgets) into the order entity
      orderTrait.portal.insertModel();
    },
    compareTraits(a: OrderEntityTrait, b: OrderEntityTrait): number {
      // Sort the order navigation alphabetically
      return Strings.compare(a.title.value, b.title.value);
    },
  })
  override readonly entities!: TraitModelSet<this, OrderEntityTrait> & RelationTrait<OrderEntityTrait>["entities"] & Observes<OrderEntityTrait>;

  // Open a downlink to the backend to get the map of orders, we can use this to create the navigation list
  // The nodeUri is inferred from the parent (the customer)
  @MapDownlink({
    laneUri: "orders",
    keyForm: Form.forString(),
    consumed: true,
    didUpdate(id: string, status: Value): void {
      // If there is a new order then insert it into the relation/navigation
      let orderTrait = this.owner.entities.get(id);
      if (orderTrait === null) {
        orderTrait = this.owner.entities.createTrait(id);
        orderTrait.nodeUri.set("/order/" + id);
        this.owner.entities.addTrait(orderTrait);
      }
    },
    didRemove(id: string, status: Value): void {
      // When an order is removed in the backend, remove it from the navigation/relation
      this.owner.removeChild(id);
    }
  })
  readonly orders!: MapDownlink<this, string, Value>;
}