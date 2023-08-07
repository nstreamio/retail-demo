package swim.retail360.agent;

import java.util.Random;
import swim.api.SwimLane;
import swim.api.agent.AbstractAgent;
import swim.api.lane.ValueLane;
import swim.concurrent.TimerRef;
import swim.structure.Record;
import swim.structure.Value;
import swim.uri.Uri;

public class CustomerSimAgent extends AbstractAgent {

  private static final long TIMER_FREQUENCY_MS = 1000;
  private static final double CHANCE_TO_PLACE_ORDER = 0.3;
  private static final int MAXIMUM_ORDER_COUNT = 2;
  private static final int MAX_PRODUCT_COUNT = 4;
  private static final double CHANCE_TO_INCLUDE_ADDITIONAL_PRODUCT_TYPE = 0.08;

  private static final String[] PRODUCT_NAMES = {"A", "B", "C", "D", "E"};

  private TimerRef timer;

  public CustomerSimAgent() {}

  @SwimLane("status")
  private final ValueLane<Value> status = this.<Value>valueLane();

  private int getActiveOrderCount() {
    final Value orderCounts = this.status.get().get("orderStates");
    return orderCounts.get("orderPlaced").intValue(0) +
        orderCounts.get("orderProcessed").intValue(0) +
        orderCounts.get("readyForPickup").intValue(0);
  }

  private void timerFunction() {
    if (getActiveOrderCount() < MAXIMUM_ORDER_COUNT && Math.random() < CHANCE_TO_PLACE_ORDER) {
      placeRandomOrder();
    }

    reschedule();
  }

  private void reschedule() {
    this.timer = setTimer(TIMER_FREQUENCY_MS, this::timerFunction);
  }

  private void placeRandomOrder() {

    // Pick at least one random product to add
    final int productIndex = new Random().nextInt(PRODUCT_NAMES.length);
    Record products = Record.create(1)
        .slot(PRODUCT_NAMES[productIndex],  new Random().nextInt(MAX_PRODUCT_COUNT) + 1);

    // Maybe add some other products
    for (final String product: PRODUCT_NAMES) {

      if (product.equals(PRODUCT_NAMES[productIndex])) {
        continue; // Already added
      }

      if (Math.random() < CHANCE_TO_INCLUDE_ADDITIONAL_PRODUCT_TYPE) {
        products.slot(product, new Random().nextInt(MAX_PRODUCT_COUNT) + 1);
      }
    }

    this.command(this.nodeUri(), Uri.parse("placeOrder"), Record.create(1).slot("products", products));
  }

  @Override
  public void didStart() {
    reschedule();
  }

}