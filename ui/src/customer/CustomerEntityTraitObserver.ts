// Copyright 2015-2022 Swim.inc
// All rights reserved.

import type {EntityTraitObserver} from "@swim/domain";
import { CustomerEntityTrait } from "./CustomerEntityTrait";

/** @public */
export interface CustomerEntityTraitObserver<T extends CustomerEntityTrait = CustomerEntityTrait> extends EntityTraitObserver<T> {
}
