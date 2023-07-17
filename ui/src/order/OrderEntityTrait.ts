// Copyright 2015-2022 Swim.inc
// All rights reserved.
import {Class, Lazy} from "@swim/util";
import type {SheetController} from "@swim/sheet";
import {ActivityController, EntityTrait} from "@swim/domain";
import type {OrderEntityTraitObserver} from "./OrderEntityTraitObserver";
import {OrderBoardController} from "./OrderBoardController";
import { Affinity } from "@swim/component";
import { Graphics, VectorIcon } from "@swim/graphics";

/** @public */
export class OrderEntityTrait extends EntityTrait {

  constructor() {
    super();
    this.icon.setValue(OrderEntityTrait.icon, Affinity.Intrinsic);
  }

  override readonly observerType?: Class<OrderEntityTraitObserver>;

  override attachCoverController(coverController: SheetController): void {
    super.attachCoverController(coverController);
    if (coverController instanceof ActivityController) {
      const boardController = new OrderBoardController();
      coverController.setTab("board", boardController);
    }
  }

  @Lazy
  static get icon(): Graphics {
    return VectorIcon.create(24, 24, "M20,2L4,2C3,2,2,2.9,2,4L2,7C2,7.7,2.4,8.3,3,8.7L3,20C3,21.1,4.1,22,5,22L19,22C19.9,22,21,21.1,21,20L21,8.7C21.6,8.3,22,7.7,22,7L22,4C22,2.9,21,2,20,2ZM15,14L9,14L9,12L15,12L15,14ZM20,7L4,7L4,4L20,4L20,7Z");
  }

}
