import { TimeSeriesController, TimeTableController } from "@nstream/widget";
import { OrderStatus, OrderType, StoreStatus } from "../../types";
import { Property } from "@swim/component";
import { DateTime, TimeZone } from "@swim/time";
import { DataPointView, LinePlotView, SeriesPlotView } from "@swim/chart";
import { Look } from "@swim/theme";
import { View, ViewRef } from "@swim/view";
import { OrderStatusPieController } from "./OrderStatusPieController";
import { KanbanColumnController } from "./KanbanColumnController";

export class OrderTypeChartController extends TimeSeriesController {
  readonly orderStatus: OrderStatus;
  readonly orderType: OrderType;

  constructor(orderStatus: OrderStatus, orderType: OrderType) {
    super();
    this.orderStatus = orderStatus;
    this.orderType = orderType;
  }

  @ViewRef({
    viewType: SeriesPlotView<DateTime, Number>,
    extends: true,
    get parentView(): View {
      const parent = (this.owner.parent as TimeTableController).graph.attachView();
      return parent;
    },
    createView(): SeriesPlotView<DateTime, number> {
      return LinePlotView.create() as LinePlotView<DateTime, number>;
    },
    initView(seriesPlotView: SeriesPlotView<DateTime, number> & { hitWidth: Property<number> }): void {
      super.initView(seriesPlotView);
      seriesPlotView.setKey(this.owner.orderType);
      seriesPlotView.hitMode.setValue('plot');
      seriesPlotView.hitWidth.setValue(15);
      seriesPlotView.addEventListener('pointerenter', () => {
        const kbColumn = this.owner.getAncestor(KanbanColumnController);
        kbColumn?.focusedOrderType.setValue(this.owner.orderType);
      });
      seriesPlotView.addEventListener('pointerleave', () => {
        const kbColumn = this.owner.getAncestor(KanbanColumnController);
        kbColumn?.focusedOrderType.setValue('');
      });
    }
  })
  override readonly plot!: ViewRef<this, SeriesPlotView<DateTime, number>> & TimeSeriesController['plot'];

  @Property({
    valueType: Number,
    value: 0,
    extends: true,
    getNextTimestamp(): number {
      let currentTimestamp = this.value.valueOf();
      this.setValue(currentTimestamp + 1);
      return currentTimestamp;
    },
  })
  readonly fakeTimestamp!: Property<this, Number> & { getNextTimestamp: () => number };

  stats(storeStatus: StoreStatus): void {
    const timestamp = this.fakeTimestamp.getNextTimestamp();
    const t = new DateTime(timestamp * 1000, TimeZone.local());
    const dataPointKey = "" + t.time;
    
    const plotView = this.plot.attachView();
    const value = storeStatus[this.orderStatus][this.orderType].value;
    let dataPointView = plotView.getChild(
      dataPointKey,
      DataPointView
    ) as DataPointView<DateTime, number>;
    if (dataPointView === null) {
      dataPointView = new DataPointView<DateTime, number>().set({
        x: t,
        y: value,
        color: OrderStatusPieController.sliceColors[this.orderStatus][this.orderType],
      });
      // dataPointView.modifyMood(Feel.default, alertStatus.moodModifier);
      plotView.dataPoints.insertView(null, dataPointView, null, "" + t.time);
    } else {
      const timing = dataPointView.getLookOr(Look.timing, true);
      dataPointView.y.set(value, timing);
    }
  }
}
