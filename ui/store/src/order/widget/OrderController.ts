// Copyright 2015-2022 Swim.inc
// All rights reserved.

import {Property} from "@swim/component";
import {Value} from "@swim/structure";
import {MapDownlink} from "@swim/client";
import {Feel, Look} from "@swim/theme";
import type {View} from "@swim/view";
import {ViewRef} from "@swim/view";
import {CellView, LeafView, RowView} from "@swim/table";
import {TextCellView} from "@swim/table";
import { Uri } from "@swim/uri";
import {TimeSeriesController} from "@nstream/widget";
import { OrderStatus, OrderType } from "../../types";
import { Status } from "@nstream/domain";
import { OrderListController } from "./OrderListController";
import { KanbanBoardController } from "./KanbanBoardController";

/** @public */
export class OrderController extends TimeSeriesController {
    readonly eventKey: OrderStatus;

    constructor(nodeUri: string, orderStatus: OrderStatus, olc: OrderListController) {
        super();
        this.setKey(nodeUri);
        this.eventKey = orderStatus;
        this.updateOrderDownlink.setNodeUri(nodeUri);
        this.updateOrderDownlink.open();
        this.focusedCustomerId.bindInlet(olc.focusedCustomerId);
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
        viewType: LeafView,
        extends: true,
        initView(leafView: LeafView): void {
            leafView.node.addEventListener('mouseenter', () => {
                if (this.owner.focusedCustomerId.value === this.owner.customerId.value) {
                    return;
                }

                const kbController = this.owner.getAncestor(KanbanBoardController);
                const futureValue = this.owner.customerId.value;
                if (kbController) {
                    kbController.focusedCustomerId.setValue(futureValue);
                } else {
                    console.warn('No KanbanBoardController found for some reason!');
                }
            });
            return;
        }
    })
    override readonly leaf!: ViewRef<this, LeafView>;

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
    readonly orderTypeCell!: ViewRef<this, CellView>;

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
            const customerId = value.get('customerId').stringValue('');
            this.owner.customerId.setValue(customerId);
            customerCellView.set({
                content: `/${customerId}`,
                classList: ['customer-cell-view'],
            });

            // test different strings depending on local or production environments
            const viewingCustomerModel = (/\/customer\//).test(window.location.protocol.includes('file') ? window.location.hash : window.location.pathname);
            const isFocusedCustomer = customerId === this.owner.focusedCustomerId.value;
            if (isFocusedCustomer && !viewingCustomerModel) {
                this.owner.leaf.attachView().set({ style: { backgroundColor: '#555555' }});
            }

            customerCellView.modifyMood(Feel.default, moodStatus!.moodModifier);
        }

        // update content and mood of orderTypeCell
        const orderTypeCellView = this.owner.orderTypeCell.view as TextCellView | null;
        if (orderTypeCellView !== null) {
            let orderType: OrderType = OrderType.Unknown;
            if (value.get("products").get("A").numberValue() ?? 0) {
            orderType = OrderType.OrderA;
            } else if (value.get("products").get("B").numberValue() ?? 0) {
            orderType = OrderType.OrderB;
            } else if (value.get("products").get("C").numberValue() ?? 0) {
            orderType = OrderType.OrderC;
            }
            orderTypeCellView.content.set(orderType);
            orderTypeCellView.set({
                classList: ['order-cell-view'],
            });
            orderTypeCellView.modifyMood(Feel.default, moodStatus!.moodModifier);
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

    @Property({
        valueType: String,
        value: false,
    })
    readonly hovered!: Property<this, boolean>;

    @Property({
        valueType: String,
        value: '',
    })
    readonly customerId!: Property<this, String>;

    @Property({
        valueType: String,
        value: '',
        didSetValue(newValue: string, oldValue: string): void {
            if (this.owner.nodeUri.value?.stringValue !== '/store/main') {
                // only highlight leaves on main store view
                return;
            }
            const leaf = this.owner.leaf.attachView();
            const customerId = this.owner.customerId.value;

            if (newValue && newValue === customerId) {
                leaf.set({style: {backgroundColor: '#555555'}})
            } else if (newValue !== customerId) {
                leaf.set({style: {backgroundColor: 'transparent'}})
            }
        }
    })
    readonly focusedCustomerId!: Property<this, String>;

    protected updateOrder(orderId: string): void {
        const idx = OrderController.orderStatusProgression.indexOf(this.eventKey);
        const newStatus = OrderController.orderStatusProgression[idx + 1];

        if (!this.updateOrderDownlink.opened) {
            this.updateOrderDownlink.open();
        }
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


    private static orderStatusMood: Map<OrderStatus, Status> = new Map<OrderStatus, Status>(
        [
          [OrderStatus.orderPlaced, Status.improving(0, 1, 2, 3, 4)(1.4)],
          [OrderStatus.orderProcessed, Status.improving(0, 1, 2, 3, 4)(2)],
          [OrderStatus.readyForPickup, Status.improving(0, 1, 2, 3, 4)(3)],
          [OrderStatus.pickupCompleted, Status.unknown()],
        ]
    );
}
