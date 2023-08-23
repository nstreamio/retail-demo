package swim.retail360.agent;

import swim.api.SwimLane;
import swim.api.agent.AbstractAgent;
import swim.api.lane.*;
import swim.structure.Form;
import swim.structure.Record;
import swim.structure.Value;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import swim.uri.Uri;

public class CustomerAgent extends AbstractAgent {

  public CustomerAgent() {}

  @SwimLane("status")
  private final ValueLane<Value> status = this.<Value>valueLane();

  @SwimLane("orders")
  private final JoinValueLane<Value, Value> orders = this.<Value, Value>joinValueLane()
      .didUpdate((orderId, newStatus, oldStatus) -> updateStatus());

  @SwimLane("addOrder")
  public final CommandLane<Value> addOrder = this.<Value>commandLane()
      .onCommand(v -> this.orders.downlink(v)
          .nodeUri(Uri.form().cast(v))
          .laneUri("status")
          .open());

  private void updateStatus() {
    final int orderCount = this.orders.size();
    long mostRecentEvent = 0;
    final Map<String, Integer> orderStatusCount = new HashMap<>();
    final Map<String, Integer> orderProductCount = new HashMap<>();

    for (final Value orderState: this.orders.values()) {

      // Calculate the most recent timestamp across all orders
      if (orderState.get("timestamp").isDefined()) {
        final long orderTimestamp = orderState.get("timestamp").longValue();
        if (orderTimestamp > mostRecentEvent) {
          mostRecentEvent = orderTimestamp;
        }
      }

      // Count the states across all orders
      final String eventType = orderState.get("status").stringValue(null);
      if (eventType != null) {
        orderStatusCount.put(eventType, orderStatusCount.getOrDefault(eventType, 0) + 1);
      }

      // Count the products across all orders
      orderState.get("products").forEach(item ->
          orderProductCount.put(
              item.key().stringValue(),
              orderProductCount.getOrDefault(item.key().stringValue(), 0) + item.intValue(0))
      );
    }

    this.status.set(
        Record.create(5)
            .slot("customerId", this.nodeUri().pathName())
            .slot("orderCount", orderCount)
            .slot("timestamp", mostRecentEvent)
            .slot("orderStates", Form.forMap(Form.forString(), Form.forInteger()).mold(orderStatusCount).toValue())
            .slot("products", Form.forMap(Form.forString(), Form.forInteger()).mold(orderProductCount).toValue())
    );
  }

  @SwimLane("placeOrder")
  public final CommandLane<Value> placeOrder = this.<Value>commandLane()
      .onCommand(v -> {
        final String orderId = UUID.randomUUID().toString();
        this.command("/order/" + orderId, "placeOrder", v.updated("customerId", this.nodeUri().pathName()));
      });

  // invoked only for simulated customers
  @SwimLane("startSim")
  public final CommandLane<Value> startSim = this.<Value>commandLane()
      .onCommand(v -> {
        openAgent("sim", CustomerSimAgent.class);
      });

  private void joinStore() {
    this.command("/store/main", "addCustomer", Uri.form().mold(nodeUri()).toValue());
  }

  @Override
  public void didStart() {
    info(nodeUri() + " didStart");
    joinStore();
  }

}
