// Copyright 2015-2022 Swim.inc
// All rights reserved.

import {Property} from "@swim/component";
import {Form, Value} from "@swim/structure";
import {MapDownlink} from "@swim/client";
import {Feel, Look} from "@swim/theme";
import type {View} from "@swim/view";
import {ViewRef} from "@swim/view";
import {CellView, RowView} from "@swim/table";
import {TextCellView} from "@swim/table";
import { Uri } from "@swim/uri";
import {TimeSeriesController} from "@swim/widget";
import { OrderStatus, OrderType } from "../../types";
import { Status } from "@swim/domain";

/** @public */
export class OrderController extends TimeSeriesController {
    readonly eventKey: OrderStatus;

    constructor(nodeUri: string, orderStatus: OrderStatus) {
        super();
        this.setKey(nodeUri);
        this.eventKey = orderStatus;
        this.updateOrderDownlink.setNodeUri(nodeUri);
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

    @ViewRef({
        viewType: CellView,
        viewKey: "customer",
        get parentView(): View | null {
            return this.owner.leaf.insertView();
        },
        createView(): CellView {
            return TextCellView.create().set({
                style: {
                    color: Look.accentColor,
                }
            });
        },
    })
    readonly customerCell!: ViewRef<this, CellView>;

    @ViewRef({
        viewType: CellView,
        viewKey: "order",
        get parentView(): View | null {
            return this.owner.leaf.insertView();
        },
        createView(): CellView {
            return TextCellView.create().set({
                style: {
                    color: Look.accentColor,
                }
            });
        },
    })
    readonly orderCell!: ViewRef<this, CellView>;

    @ViewRef({
        viewType: CellView,
        viewKey: "timeInProcessing",
        get parentView(): View | null {
            return this.owner.leaf.insertView();
        },
        createView(): CellView {
            return TextCellView.create().set({
                style: {
                    color: Look.accentColor,
                }
            });
        },
    })
    readonly timeInProcessingCell!: ViewRef<this, CellView>;

    @Property({
        valueType: Value,
        value: Value.absent(),
        didSetValue(value: Value): void {

        let moodStatus = OrderController.orderStatusMood.get(this.owner.eventKey);

        // update content and mood of customerCell
        const customerCellView = this.owner.customerCell.view as TextCellView | null;
        if (customerCellView !== null) {
            customerCellView.set({
                content: '/' + value.get('customerId').stringValue(),
                classList: ['customer-cell-view'],
            });
            customerCellView.modifyMood(Feel.default, moodStatus!.moodModifier);
        }

        // update content and mood of orderCell
        const orderCellView = this.owner.orderCell.view as TextCellView | null;
        if (orderCellView !== null) {
            let orderType: OrderType = OrderType.Unknown;
            if (value.get("products").get("A").numberValue() ?? 0) {
            orderType = OrderType.OrderA;
            } else if (value.get("products").get("B").numberValue() ?? 0) {
            orderType = OrderType.OrderB;
            } else if (value.get("products").get("C").numberValue() ?? 0) {
            orderType = OrderType.OrderC;
            }
            orderCellView.content.set(`Order ${orderType}`);
            orderCellView.set({
                classList: ['order-cell-view'],
            });
            orderCellView.modifyMood(Feel.default, moodStatus!.moodModifier);
        }

        // update content and mood of timeInProcessingCell
        const timeInProcessingCellView = this.owner.timeInProcessingCell.view as TextCellView | null;
        if (timeInProcessingCellView !== null) {
            timeInProcessingCellView.content.set(new Date(value.get('timestamp').numberValue() ?? 0).toString());
            timeInProcessingCellView.set({
                classList: ['time-in-processing-cell-view'],
            });
            timeInProcessingCellView.modifyMood(Feel.default, moodStatus!.moodModifier);
        }
        },
    })
    readonly stats!: Property<this, Value>;

    protected updateOrder(orderId: string): void {
        const idx = OrderController.orderStatusProgression.indexOf(this.eventKey);
        const newStatus = OrderController.orderStatusProgression[idx + 1];

        this.updateOrderDownlink.command(`{status:${newStatus}}`);
    }








































    
    @MapDownlink({
        hostUri: 'warp://localhost:9001',
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


    private static orderStatusMood: Map<String, Status> = new Map<String, Status>([
        ["orderPlaced", Status.alert()],
        ["orderProcessed", Status.warning()],
        ["readyForPickup", Status.normal()]
    ]);
}
