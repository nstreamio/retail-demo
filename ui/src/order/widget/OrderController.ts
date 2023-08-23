// Copyright 2015-2022 Swim.inc
// All rights reserved.

import { MapDownlink } from "@swim/client";
import { Value } from "@swim/structure";
import { RowView } from "@swim/table";
import { Uri } from "@swim/uri";
import { ViewRef } from "@swim/view";
import {TimeSeriesController} from "@swim/widget";
import { OrderStatus } from "../../types";

/** @public */
export class OrderController extends TimeSeriesController {  

    readonly eventKey: OrderStatus;

    constructor(orderId: string, orderStatus: OrderStatus) {
        super();
        this.setKey(orderId);
        this.eventKey = orderStatus;

        this.updateOrderDownlink.setHostUri('warp://localhost:9001');
        this.updateOrderDownlink.setNodeUri(`/order/${orderId}`);
        this.updateOrderDownlink.open();
    }

    @ViewRef({
        viewType: RowView,
        initView(rowView: RowView): void {
            const that = this;
            const handleClick = function(orderId: string) {
                return function() {
                    that.owner.updateOrder(orderId);
                }
            };
            
            rowView.set({
                style: {
                    cursor: 'pointer',
                },
            });
            rowView.addEventListener('click', handleClick(this.owner.key!));
        }
    })
    override readonly row!: ViewRef<this, RowView>;

    protected updateOrder(orderId: string): void {
        const idx = OrderController.orderStatusProgression.indexOf(this.eventKey);
        const newStatus = OrderController.orderStatusProgression[idx + 1];

        this.updateOrderDownlink.command(`{status:${newStatus}}`);
    }

    @MapDownlink({
        laneUri: "updateOrder",
        consumed: true,
        keyForm: Uri.form(),
    })
    readonly updateOrderDownlink!: MapDownlink<this, Uri, Value>;

    private static orderStatusProgression: OrderStatus[] = [
        OrderStatus.orderPlaced,
        OrderStatus.orderProcessed,
        OrderStatus.readyForPickup,
        OrderStatus.pickupCompleted,
    ];
}
