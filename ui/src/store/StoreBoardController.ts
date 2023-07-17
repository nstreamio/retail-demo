// Copyright 2015-2022 Swim.inc
// All rights reserved.

import {Affinity} from "@swim/component";
import {Trait, TraitRef} from "@swim/model";
import {TraitViewRef} from "@swim/controller";
import {PanelView, BoardView, BoardController} from "@swim/panel";
import {EntityTrait} from "@swim/domain";
import { OrderListController } from "../order";

/** @public */
export class StoreBoardController extends BoardController {
  constructor() {
    super();
    this.initBoard();
  }

  protected initBoard(): void {
    const boardView = this.sheet.attachView();
    const panelView = boardView.appendChild(PanelView).margin(7);

    const orderListController = this.appendChild(OrderListController, "orderList");
    orderListController.panel.insertView(panelView).unitWidth(1 / 3).unitHeight(1);
  }

  @TraitViewRef<StoreBoardController["sheet"]>({
    extends: BoardController.sheet,
    viewDidMount(boardView: BoardView): void {
      this.owner.consume(boardView);
    },
    viewWillUnmount(boardView: BoardView): void {
      this.owner.unconsume(boardView);
    },
  })
  override readonly sheet!: TraitViewRef<this, Trait, BoardView> & BoardController["sheet"];

  @TraitRef<StoreBoardController["entity"]>({
    traitType: EntityTrait,
    inherits: true,
    initTrait(entityTrait: EntityTrait): void {
      this.owner.hostUri.setValue(entityTrait.hostUri.value, Affinity.Intrinsic);
      this.owner.nodeUri.setValue(entityTrait.nodeUri.value, Affinity.Intrinsic);
    },
  })
  readonly entity!: TraitRef<this, EntityTrait>;

}
