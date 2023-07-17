// Copyright 2015-2022 Swim.inc
// All rights reserved.
import {Class} from "@swim/util";
import type {SheetController} from "@swim/sheet";
import {ActivityController, EntityTrait} from "@swim/domain";
import type {CustomerEntityTraitObserver} from "./CustomerEntityTraitObserver";
import {CustomerBoardController} from "./CustomerBoardController";

/** @public */
export class CustomerEntityTrait extends EntityTrait {

  override readonly observerType?: Class<CustomerEntityTraitObserver>;

  override attachCoverController(coverController: SheetController): void {
    super.attachCoverController(coverController);
    if (coverController instanceof ActivityController) {
      const boardController = new CustomerBoardController();
      coverController.setTab("board", boardController);
    }
  }

}
