import { TimeSeriesController } from "@swim/widget";
import { OrderStatus, OrderType, StoreStatus } from "../../types";
import { Property } from "@swim/component";
import { DateTime, TimeZone } from "@swim/time";
import { DataPointView, LinePlotView, SeriesPlotView } from "@swim/chart";
import { Look } from "@swim/theme";
import { View, ViewRef } from "@swim/view";
import { Observes } from "@swim/util";

export class OrderTypeChartController extends TimeSeriesController {
  readonly orderStatus: OrderStatus;
  readonly orderType: OrderType;

  constructor(orderStatus: OrderStatus, orderType: OrderType) {
    super();
    this.orderStatus = orderStatus;
    this.orderType = orderType;

    if (this.orderStatus === OrderStatus.orderPlaced) {
      console.log('constructor of OrderTypeChartController');
    }
  }

  @ViewRef({
    viewType: SeriesPlotView<DateTime, Number>,
    extends: true,
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
    // const userCount = value.get("User_Count").numberValue(0);
    // const kpi = value.get(this.kpiName.value);
    // const alertCount = kpi.get("Alert_User_Count").numberValue(0);
    // const alertRatio = userCount !== 0 ? alertCount / userCount : 0;
    // const alertStatus = ClusterHistoryController.alertStatus(alertRatio);
    const dataPointKey = "" + t.time;
    
    const plotView = this.plot.attachView();
    const value = storeStatus[this.orderStatus][this.orderType].value;
    let dataPointView = plotView.getChild(
      dataPointKey,
      DataPointView
    ) as DataPointView<DateTime, number>;
    if (this.orderStatus === OrderStatus.orderPlaced) {
      console.log(`New data point for ${this.orderType.toUpperCase()}. TIME is ${timestamp}. VALUE is ${value}.`);
    }
    if (dataPointView === null) {
      dataPointView = new DataPointView<DateTime, number>().set({
        x: t,
        y: value,
        color: Look.accentColor,
      });
      // dataPointView.modifyMood(Feel.default, alertStatus.moodModifier);
      plotView.dataPoints.insertView(null, dataPointView, null, "" + t.time);
      if (this.orderStatus === OrderStatus.orderPlaced) {
        console.log(`Inserted new DataPointView in controller. Controller now has ${plotView.dataPoints.viewCount} datapoints`);
      }

    } else {
      const timing = dataPointView.getLookOr(Look.timing, true);
      dataPointView.y.set(value, timing);

      if (this.orderStatus === OrderStatus.orderPlaced) {
        console.log(`Updated existing DataPointView in controller. Controller now has ${plotView.dataPoints.viewCount} datapoints`);
      }
      // dataPointView.modifyMood(
      //   Feel.default,
      //   alertStatus.moodModifier,
      //   timing
      // );
    }

    // if (this.orderStatus === OrderStatus.orderPlaced) {
    //   console.log(`this OrderTypeChartController, orderType ${this.orderType}: ${this}`);
    // }

    // orderTypeChartController should have three custom plots which it creates and inserts automatically
    // orderTypeChartController.stats should update all three plots by adding a new datapoint
    // for now, let's just get one plot to appear on orderTypeChartController at a time.
    // we will use the value for each orderType for the appropriate orderStatus (y-axis)
    // we will use integers increasing from 0 as a placeholder for timestamps (x-axis)
    // I must ask Ajay for a map lane so i can get this same data along with a timestamp.
  }
}
