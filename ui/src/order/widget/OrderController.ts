// Copyright 2015-2022 Swim.inc
// All rights reserved.

import {Property} from "@swim/component";
import {Value} from "@swim/structure";
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

        //   const sliceView = this.owner.slice.view;
        //   if (sliceView !== null) {
        //     const impactStatus = OrderController.impactStatus(alertCount);
        //     sliceView.modifyMood(Feel.default, impactStatus.moodModifier);
        //   }

        //   const leafView = this.owner.leaf.view;
        //   if (leafView !== null) {
        //     const impactStatus = OrderController.impactStatus(alertCount);
        //     leafView.modifyMood(Feel.default, impactStatus.moodModifier);
        //   }

        let moodStatus = OrderController.orderStatusMood.get(this.owner.eventKey);

        const customerCellView = this.owner.customerCell.view as TextCellView | null;
        if (customerCellView !== null) {
            customerCellView.set({
                content: '/' + value.get('customerId').stringValue(),
                classList: ['customer-cell-view'],
            });
            customerCellView.modifyMood(Feel.default, moodStatus!.moodModifier);
        }

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

    //   @MapDownlink({
    //     laneUri: "alertHistory",
    //     consumed: true,
    //     keyForm: Form.forNumber(),
    //     updateKpi(kpiName: string | undefined, key: number, value: Value): void {
    //       const t = new DateTime(key * 1000, TimeZone.local());
    //       const userCount = value.get("User_Count").numberValue(0);
    //       const kpi = value.get(this.owner.kpiName.value);
    //       const alertCount = kpi.get("Alert_User_Count").numberValue(0);
    //       const alertRatio = userCount !== 0 ? alertCount / userCount : 0;
    //       const alertStatus = OrderController.alertStatus(alertRatio);

    //       const plotView = this.owner.plot.attachView();
    //       const dataPointKey = "" + t.time;
    //       let dataPointView = plotView.getChild(dataPointKey, DataPointView) as DataPointView<DateTime, number>;
    //       if (dataPointView === null) {
    //         dataPointView = new DataPointView<DateTime, number>().set({
    //           x: t,
    //           y: alertCount,
    //           color: Look.accentColor,
    //         });
    //         dataPointView.modifyMood(Feel.default, alertStatus.moodModifier);
    //         plotView.dataPoints.insertView(null, dataPointView, null, "" + t.time);
    //       } else {
    //         const timing = dataPointView.getLookOr(Look.timing, true);
    //         dataPointView.y.set(alertCount, timing);
    //         dataPointView.modifyMood(Feel.default, alertStatus.moodModifier, timing);
    //       }
    //     },
    //     didUpdate(key: number, value: Value): void {
    //       //console.log("OrderController.alertHistoryDownlink.didUpdate " + key + ":", value.toLike());
    //       this.updateKpi(this.owner.kpiName.value, key, value);
    //     },
    //     didRemove(key: number): void {
    //       //console.log("OrderController.alertHistoryDownlink.didRemove " + key);
    //       const t = new DateTime(key * 1000, TimeZone.local());
    //       this.owner.plot.attachView().removeChild("" + t.time);
    //     },
    //   })
    //   readonly alertHistoryDownlink!: MapDownlink<this, number, Value> & {
    //     updateKpi(kpiName: string | undefined, key: number, value: Value): void,
    //   };

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


    private static orderStatusMood: Map<String, Status> = new Map<String, Status>([
        ["orderPlaced", Status.alert()],
        ["orderProcessed", Status.warning()],
        ["readyForPickup", Status.normal()]
    ]);
}
