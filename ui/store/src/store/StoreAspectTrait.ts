// Copyright 2015-2022 Swim.inc
// All rights reserved.

import {Lazy} from "@swim/util";
import type {Graphics} from "@swim/graphics";
import {VectorIcon} from "@swim/graphics";
import type {SheetController} from "@swim/sheet";
import {AspectTrait} from "@nstream/domain";
import { KanbanBoardController } from "../order";

/** @public */
export class StoreAspectTrait extends AspectTrait {
  constructor() {
    super();
    this.id.setIntrinsic("portal");
    this.title.setIntrinsic("Portal");
    this.icon.setIntrinsic(StoreAspectTrait.icon);
  }

  // Define the board controller to be used that will control all the widgets/cards the store will have
  // We will use the 'OrderKanbanBoard' which is 3 panels showing order status
  override createTabController(): SheetController | null {
    return new KanbanBoardController();
  }

  // The icon to show the 'portal' (at the top - alternative to atlas)
  @Lazy
  static get icon(): Graphics {
    return VectorIcon.create(24, 24, "M19 5v2h-4V5h4M9 5v6H5V5h4m10 8v6h-4v-6h4M9 17v2H5v-2h4M21 3h-8v6h8V3zM11 3H3v10h8V3zm10 8h-8v10h8V11zm-10 4H3v6h8v-6z");
  }
}
