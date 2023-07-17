// Copyright 2015-2022 Swim.inc
// All rights reserved.

import {Affinity} from "@swim/component";
import {Trait, TraitRef} from "@swim/model";
import {TraitViewRef} from "@swim/controller";
import {PanelView, BoardView, BoardController} from "@swim/panel";
import {EntityTrait} from "@swim/domain";
import { OrderListController } from "../order";

/** @public */
export class CustomerBoardController extends BoardController {
  constructor() {
    super();
    this.initBoard();
  }

  protected initBoard(): void {
    const boardView = this.sheet.attachView();
    const panelView = boardView.appendChild(PanelView).margin(7);

    const orderPlaceListController = this.appendChild(new OrderListController("New Orders", "orderPlaced"), "newOrders");
    orderPlaceListController.panel.insertView(panelView).unitWidth(1 / 3).unitHeight(1);

    const orderProcessingListController = this.appendChild(new OrderListController("Processing", "orderProcessed"), "processingOrders");
    orderProcessingListController.panel.insertView(panelView).unitWidth(1 / 3).unitHeight(1);

    const orderReadyListController = this.appendChild(new OrderListController("Ready Orders", "readyForPickup"), "readyOrders");
    orderReadyListController.panel.insertView(panelView).unitWidth(1 / 3).unitHeight(1);
  }

  @TraitViewRef<CustomerBoardController["sheet"]>({
    extends: BoardController.sheet,
    viewDidMount(boardView: BoardView): void {
      this.owner.consume(boardView);
    },
    viewWillUnmount(boardView: BoardView): void {
      this.owner.unconsume(boardView);
    },
  })
  override readonly sheet!: TraitViewRef<this, Trait, BoardView> & BoardController["sheet"];

  @TraitRef<CustomerBoardController["entity"]>({
    traitType: EntityTrait,
    inherits: true,
    initTrait(entityTrait: EntityTrait): void {
      this.owner.hostUri.setValue(entityTrait.hostUri.value, Affinity.Intrinsic);
      this.owner.nodeUri.setValue(entityTrait.nodeUri.value, Affinity.Intrinsic);
    },
  })
  readonly entity!: TraitRef<this, EntityTrait>;

}
