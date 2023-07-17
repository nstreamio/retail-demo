// Copyright 2015-2022 Swim.inc
// All rights reserved.

import type {EntityTraitObserver} from "@swim/domain";
import { OrderEntityTrait } from "./OrderEntityTrait";

/** @public */
export interface OrderEntityTraitObserver<T extends OrderEntityTrait = OrderEntityTrait> extends EntityTraitObserver<T> {
}
