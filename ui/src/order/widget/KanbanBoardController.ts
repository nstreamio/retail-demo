// Copyright 2015-2022 Swim.inc
// All rights reserved.

import {Trait, TraitRef} from "@swim/model";
import {TraitViewRef} from "@swim/controller";
import {PanelView, BoardView, BoardController, PanelController} from "@swim/panel";
import {EntityTrait} from "@swim/domain";
import { OrderListController } from "..";
import { OrderStatus } from "../../types";
import { OrderStatusPieController } from "./OrderStatusPieController";
import { Property } from "@swim/component";
import { KanbanColumnController } from "./KanbanColumnController";

/** @public */
export class KanbanBoardController extends BoardController {
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

    const orderPlacedColumnController = this.appendChild(new KanbanColumnController(), `KbColumn${OrderStatus.orderPlaced}`)
    const orderPlacedPanelView = orderPlacedColumnController.panel.insertView(rootPanelView).set({
      unitWidth: 1 / 3,
      unitHeight: 1,
      style: {
        margin: 6,
      },
    });

    const orderPlacedPieController = orderPlacedColumnController.appendChild(new OrderStatusPieController(OrderStatus.orderPlaced, "New Orders"), `Pie${OrderStatus.orderPlaced}`);
    orderPlacedPieController.focusedOrderType.bindInlet(orderPlacedColumnController.focusedOrderType);
    orderPlacedPieController.panel.insertView(orderPlacedPanelView).set({
      unitWidth: 1,
      unitHeight: 1 / 3,
      style: {
        margin: 0,
      }
    });

    const orderPlacedListController = orderPlacedColumnController.appendChild(new OrderListController(OrderStatus.orderPlaced, this), `List${OrderStatus.orderPlaced}`);
    orderPlacedListController.focusedOrderType.bindInlet(orderPlacedColumnController.focusedOrderType);
    orderPlacedListController.panel.insertView(orderPlacedPanelView).set({
      unitWidth: 1,
      unitHeight: 2 / 3,
      style: {
        margin: 0
      }
    });

    const orderProcessedColumnController = this.appendChild(new KanbanColumnController(), `KbColumn${OrderStatus.orderProcessed}`)
    const orderProcessedPanelView = orderProcessedColumnController.panel.insertView(rootPanelView).set({
      unitWidth: 1 / 3,
      unitHeight: 1,
      style: {
        margin: 6,
      },
    });

    const orderProcessedPieController = orderProcessedColumnController.appendChild(new OrderStatusPieController(OrderStatus.orderProcessed, "Processing"), `Pie${OrderStatus.orderProcessed}`);
    orderProcessedPieController.focusedOrderType.bindInlet(orderProcessedColumnController.focusedOrderType);
    orderProcessedPieController.panel.insertView(orderProcessedPanelView).set({
      unitWidth: 1,
      unitHeight: 1 / 3,
      style: {
        margin: 0,
      }
    });

    const orderProcessedListController = orderProcessedColumnController.appendChild(new OrderListController(OrderStatus.orderProcessed, this), `List${OrderStatus.orderProcessed}`);
    orderProcessedListController.focusedOrderType.bindInlet(orderProcessedColumnController.focusedOrderType);
    orderProcessedListController.panel.insertView(orderProcessedPanelView).set({
      unitWidth: 1,
      unitHeight: 2 / 3,
      style: {
        margin: 0
      }
    });

    const orderReadyColumnController = this.appendChild(new KanbanColumnController(), `KbColumn${OrderStatus.readyForPickup}`)
    const orderReadyPanelView = orderReadyColumnController.panel.insertView(rootPanelView).set({
      unitWidth: 1 / 3,
      unitHeight: 1,
      style: {
        margin: 6,
      },
    });

    const orderReadyPieController = orderReadyColumnController.appendChild(new OrderStatusPieController(OrderStatus.readyForPickup, "Ready Orders"), `Pie${OrderStatus.readyForPickup}`);
    orderReadyPieController.focusedOrderType.bindInlet(orderReadyColumnController.focusedOrderType);
    orderReadyPieController.panel.insertView(orderReadyPanelView).set({
      unitWidth: 1,
      unitHeight: 1 / 3,
      style: {
        margin: 0,
      }
    });

    const orderReadyListController = orderReadyColumnController.appendChild(new OrderListController(OrderStatus.readyForPickup, this), `List${OrderStatus.readyForPickup}`);
    orderReadyListController.focusedOrderType.bindInlet(orderReadyColumnController.focusedOrderType);
    orderReadyListController.panel.insertView(orderReadyPanelView).set({
      unitWidth: 1,
      unitHeight: 2 / 3,
      style: {
        margin: 0
      }
    });
  }

  @Property({
    valueType: String,
    value: '',
  })
  readonly focusedCustomerId!: Property<this, String>;

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
