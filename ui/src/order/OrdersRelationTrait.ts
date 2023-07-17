// Copyright 2015-2022 Swim.inc
// All rights reserved.

import {Affinity} from "@swim/component";
import {Form, type Value} from "@swim/structure";
import {MapDownlink} from "@swim/client";
import {RelationTrait} from "@swim/domain";
import {OrderEntityTrait} from "./OrderEntityTrait";

/** @public */
export class OrdersRelationTrait extends RelationTrait {
  constructor() {
    super();
    this.title.setValue("Orders", Affinity.Intrinsic);
  }

  @MapDownlink<OrdersRelationTrait["orders"]>({
    laneUri: "state",
    keyForm: Form.forString(),
    consumed: true,
    didUpdate(name: string, status: Value): void {
      let orderModel = this.owner.getChild(name);
        if (orderModel === null) {
            let orderTrait: OrderEntityTrait = new OrderEntityTrait();
            orderTrait.title.setValue(name, Affinity.Intrinsic);
            this.owner.entities.addTrait(orderTrait, void 0, name);
        }
    },
    didRemove(name: string, status: Value): void {
      this.owner.removeChild(name);
    }
  })
  readonly orders!: MapDownlink<this, string, Value>;
}