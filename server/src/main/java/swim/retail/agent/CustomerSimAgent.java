package swim.retail.agent;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.UUID;
import swim.api.SwimLane;
import swim.api.agent.AbstractAgent;
import swim.api.lane.ValueLane;
import swim.concurrent.TimerRef;
import swim.retail.model.Product;
import swim.structure.Record;
import swim.structure.Value;

public class CustomerSimAgent extends AbstractAgent {

  private static final long TIMER_FREQUENCY_MS = 2000;
  private static final double CHANCE_TO_PLACE_ORDER = 0.3;
  private static final int MAXIMUM_ORDER_COUNT = 2;
  private static final int MAX_PRODUCT_COUNT = 4;

  private static final Product[] PRODUCT_NAMES = Product.values();

  private TimerRef timer;

  public CustomerSimAgent() {}

  @SwimLane("status")
  private final ValueLane<Value> status = valueLane();

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

  private List<String> simOrderIds = new ArrayList<>();
  private int simOrderIdIndex = -1;

  private void placeRandomOrder() {
    // Pick at least one random product to add
    final int productIndex = new Random().nextInt(PRODUCT_NAMES.length);
    Record products = Record.create(1)
        .slot(PRODUCT_NAMES[productIndex].name(),  1);
    final String orderId;
    if (this.simOrderIds.size() == 20) {
      this.simOrderIdIndex = this.simOrderIdIndex  == 19 ? 0 : this.simOrderIdIndex  + 1;
      orderId = this.simOrderIds.get(this.simOrderIdIndex);
    } else {
      orderId = UUID.randomUUID().toString();
      this.simOrderIds.add(orderId);
    }

    final Value payload = Record.create(1).slot("products", products).slot("customerId", this.nodeUri().pathName());
    this.command("/order/" + orderId, "simOrder", payload);
  }

  @Override
  public void didStart() {
    reschedule();
  }

}
