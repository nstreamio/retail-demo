import { TimeSeriesController, TimeTableController } from "@swim/widget";
import { OrderStatus, OrderType, StoreStatus } from "../../types";
import { Property } from "@swim/component";
import { DateTime, TimeZone } from "@swim/time";
import { DataPointView, LinePlotView, SeriesPlotView } from "@swim/chart";
import { Look } from "@swim/theme";
import { View, ViewRef } from "@swim/view";
import { Observes } from "@swim/util";
import { OrderStatusPieController } from "./OrderStatusPieController";

export class OrderTypeChartController extends TimeSeriesController {
  readonly orderStatus: OrderStatus;
  readonly orderType: OrderType;

  constructor(orderStatus: OrderStatus, orderType: OrderType) {
    super();
    this.orderStatus = orderStatus;
    this.orderType = orderType;

    if (this.orderStatus === OrderStatus.orderPlaced) {
      // console.log('constructor of OrderTypeChartController');
    }
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
    initView(seriesPlotView: SeriesPlotView<DateTime, number>): void {
      super.initView(seriesPlotView);
      seriesPlotView.setKey(this.owner.orderType);
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
    if (this.orderStatus === OrderStatus.orderPlaced) {
      // console.log('plotView: ', plotView);
      // console.log('plotView.parent: ', plotView.parent);
      // console.log(`New data point for ${this.orderType.toUpperCase()}. TIME is ${timestamp}. VALUE is ${value}.`);
    }
    if (dataPointView === null) {
      dataPointView = new DataPointView<DateTime, number>().set({
        x: t,
        y: value,
        color: OrderStatusPieController.sliceColors.get(this.orderType),
      });
      // dataPointView.modifyMood(Feel.default, alertStatus.moodModifier);
      plotView.dataPoints.insertView(null, dataPointView, null, "" + t.time);
      if (this.orderStatus === OrderStatus.orderPlaced) {
        // console.log(`Inserted new DataPointView in controller. Controller now has ${plotView.dataPoints.viewCount} datapoints`);
      }

    } else {
      const timing = dataPointView.getLookOr(Look.timing, true);
      dataPointView.y.set(value, timing);

      if (this.orderStatus === OrderStatus.orderPlaced) {
        // console.log(`Updated existing DataPointView in controller. Controller now has ${plotView.dataPoints.viewCount} datapoints`);
      }
      // dataPointView.modifyMood(
      //   Feel.default,
      //   alertStatus.moodModifier,
      //   timing
      // );
    }
  }
}
