// Copyright 2015-2022 Swim.inc
// All rights reserved.

import {Trait, TraitRef} from "@swim/model";
import {TraitViewRef} from "@swim/controller";
import {PanelView, BoardView, BoardController} from "@swim/panel";
import {EntityTrait} from "@swim/domain";
import { OrderListController } from "..";
import { OrderStatus } from "../../types";

/** @public */
export class OrderKanbanBoardController extends BoardController {
  constructor() {
    super();
    this.initBoard();
  }

  protected initBoard(): void {
    const boardView = this.sheet.attachView();
    const panelView = boardView.appendChild(PanelView).style.set({
      margin: 6,
    });

    // The order kanban board consists of 3 lists of orders (the same except they have different status')
    // Each panel takes up the full height of the sheet and 1/3 of the width
    // We insert each widget by inserting each controller's 'panel'

    const orderPlaceListController = this.appendChild(new OrderListController("New Orders", OrderStatus.orderPlaced), OrderStatus.orderPlaced);
    orderPlaceListController.panel.insertView(panelView).set({
      unitWidth: 1 / 3,
      unitHeight: 1,
    });

    const orderProcessingListController = this.appendChild(new OrderListController("Processing", OrderStatus.orderProcessed), OrderStatus.orderProcessed);
    orderProcessingListController.panel.insertView(panelView).set({
      unitWidth: 1 / 3,
      unitHeight: 1,
    });

    const orderReadyListController = this.appendChild(new OrderListController("Ready Orders", OrderStatus.readyForPickup), OrderStatus.readyForPickup);
    orderReadyListController.panel.insertView(panelView).set({
      unitWidth: 1 / 3,
      unitHeight: 1,
    });
  }

  @TraitViewRef({
    extends: true,
    viewDidMount(boardView: BoardView): void {
      this.owner.consume(boardView);
    },
    viewWillUnmount(boardView: BoardView): void {
      this.owner.unconsume(boardView);
    },
  })
  override readonly sheet!: TraitViewRef<this, Trait, BoardView> & BoardController["sheet"];

  @TraitRef({
    traitType: EntityTrait,
    inherits: true,
    initTrait(entityTrait: EntityTrait): void {
      this.owner.hostUri.bindInlet(entityTrait.hostUri);
      this.owner.nodeUri.bindInlet(entityTrait.nodeUri);
    }
  })
  readonly entity!: TraitRef<this, EntityTrait>;

}
