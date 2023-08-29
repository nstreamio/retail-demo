// Copyright 2015-2022 Swim.inc
// All rights reserved.

import {Trait, TraitRef} from "@swim/model";
import {TraitViewRef} from "@swim/controller";
import {PanelView, BoardView, BoardController, PanelController} from "@swim/panel";
import {EntityTrait} from "@swim/domain";
import { OrderListController } from "..";
import { OrderStatus } from "../../types";
import { OrderStatusPieController } from "./OrderStatusPieController";

/** @public */
export class OrderKanbanBoardController extends BoardController {
  constructor() {
    super();
    this.initBoard();
  }

  protected initBoard(): void {
    const boardView = this.sheet.attachView();
    const rootPanelView = boardView.appendChild(PanelView).style.set({
      margin: 6,
    });

    // The order kanban board consists of 3 lists of orders (the same except they have different statuses)
    // Each panel takes up the full height of the sheet and 1/3 of the width
    // We insert each widget by inserting each controller's 'panel'

    const orderPlacedPanelController = this.appendChild(new PanelController(), `Panel${OrderStatus.orderPlaced}`)
    const orderPlacedPanelView = orderPlacedPanelController.panel.insertView(rootPanelView).set({
      unitWidth: 1 / 3,
      unitHeight: 1,
      style: {
        margin: 6,
      },
    });

    const orderPlacedPieController = orderPlacedPanelController.appendChild(new OrderStatusPieController(OrderStatus.orderPlaced, "New Orders"), `Pie${OrderStatus.orderPlaced}`);
    orderPlacedPieController.panel.insertView(orderPlacedPanelView).set({
      unitWidth: 1,
      unitHeight: 1 / 3,
      style: {
        margin: 0,
      }
    });

    const orderPlacedListController = orderPlacedPanelController.appendChild(new OrderListController(OrderStatus.orderPlaced), `List${OrderStatus.orderPlaced}`);
    orderPlacedListController.panel.insertView(orderPlacedPanelView).set({
      unitWidth: 1,
      unitHeight: 2 / 3,
      style: {
        margin: 0
      }
    });

    const orderProcessedPanelController = this.appendChild(new PanelController(), `Panel${OrderStatus.orderProcessed}`)
    const orderProcessedPanelView = orderProcessedPanelController.panel.insertView(rootPanelView).set({
      unitWidth: 1 / 3,
      unitHeight: 1,
      style: {
        margin: 6,
      },
    });

    const orderProcessedPieController = orderProcessedPanelController.appendChild(new OrderStatusPieController(OrderStatus.orderProcessed, "Processing"), `Pie${OrderStatus.orderProcessed}`);
    orderProcessedPieController.panel.insertView(orderProcessedPanelView).set({
      unitWidth: 1,
      unitHeight: 1 / 3,
      style: {
        margin: 0,
      }
    });

    const orderProcessedListController = orderProcessedPanelController.appendChild(new OrderListController(OrderStatus.orderProcessed), `List${OrderStatus.orderProcessed}`);
    orderProcessedListController.panel.insertView(orderProcessedPanelView).set({
      unitWidth: 1,
      unitHeight: 2 / 3,
      style: {
        margin: 0
      }
    });

    const orderReadyPanelController = this.appendChild(new PanelController(), `Panel${OrderStatus.readyForPickup}`)
    const orderReadyPanelView = orderReadyPanelController.panel.insertView(rootPanelView).set({
      unitWidth: 1 / 3,
      unitHeight: 1,
      style: {
        margin: 6,
      },
    });

    const orderReadyPieController = orderReadyPanelController.appendChild(new OrderStatusPieController(OrderStatus.readyForPickup, "Ready Orders"), `Pie${OrderStatus.readyForPickup}`);
    orderReadyPieController.panel.insertView(orderReadyPanelView).set({
      unitWidth: 1,
      unitHeight: 1 / 3,
      style: {
        margin: 0,
      }
    });

    const orderReadyListController = orderReadyPanelController.appendChild(new OrderListController(OrderStatus.readyForPickup), `List${OrderStatus.readyForPickup}`);
    orderReadyListController.panel.insertView(orderReadyPanelView).set({
      unitWidth: 1,
      unitHeight: 2 / 3,
      style: {
        margin: 0
      }
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
