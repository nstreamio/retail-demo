// Copyright 2015-2022 Swim.inc
// All rights reserved.

import {Trait, TraitRef} from "@swim/model";
import {TraitViewRef} from "@swim/controller";
import {PanelView, BoardView, BoardController} from "@swim/panel";
import {EntityTrait} from "@swim/domain";
import { OrderListController } from "..";

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

    const orderPlaceListController = this.appendChild(new OrderListController("New Orders", "orderPlaced"), "orderPlaced");
    orderPlaceListController.panel.insertView(panelView).set({
      unitWidth: 1 / 3,
      unitHeight: 1,
    });

    const orderProcessingListController = this.appendChild(new OrderListController("Processing", "orderProcessed"), "processingOrders");
    orderProcessingListController.panel.insertView(panelView).set({
      unitWidth: 1 / 3,
      unitHeight: 1,
    });

    const orderReadyListController = this.appendChild(new OrderListController("Ready Orders", "readyForPickup"), "readyOrders");
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
