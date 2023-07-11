// Copyright 2015-2022 Swim.inc
// All rights reserved.

import type {EntityTraitObserver} from "@swim/domain";
import { StoreEntityTrait } from "./StoreEntityTrait";

/** @public */
export interface StoreEntityTraitObserver<T extends StoreEntityTrait = StoreEntityTrait> extends EntityTraitObserver<T> {
}
