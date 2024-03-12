package swim.retail.agent;

import swim.api.SwimLane;
import swim.api.agent.AbstractAgent;
import swim.api.lane.CommandLane;
import swim.api.lane.MapLane;
import swim.api.lane.ValueLane;
import swim.recon.Recon;
import swim.structure.Record;
import swim.structure.Value;
import swim.uri.Uri;
import static swim.retail.model.OrderStatus.ORDER_PLACED;
import static swim.retail.model.OrderStatus.ORDER_STATUSES;

public class OrderAgent extends AbstractAgent {


  public OrderAgent() {}

  @SwimLane("status")
  private final ValueLane<Value> status = valueLane();

  @SwimLane("statusHistory")
  private final MapLane<Long, String> statusHistory = mapLane();

  @SwimLane("placeOrder")
  public final CommandLane<Value> placeOrder = this.<Value>commandLane()
      .onCommand(this::newOrder);

  @SwimLane("simOrder")
  public final CommandLane<Value> simOrder = this.<Value>commandLane()
        .onCommand(this::simOrder);

  @SwimLane("updateOrder")
  public final CommandLane<Value> updateOrder = this.<Value>commandLane()
      .onCommand(this::progressOrder);

  private void simOrder(final Value orderDetails) {
    openAgent("sim", OrderSimAgent.class);
    newOrder(orderDetails);
  }

  private void newOrder(final Value orderDetails) {
    final long timestamp = System.currentTimeMillis();

    info (nodeUri() + " new order placed: " + Recon.toString(orderDetails));

    final String orderId = this.nodeUri().pathName();
    final String customerId = orderDetails.get("customerId").stringValue();
    final String orderStatus = ORDER_PLACED;
    final boolean hasHistory = !this.statusHistory.isEmpty();
    if (hasHistory) {
      this.statusHistory.clear();
    }
    this.statusHistory.put(timestamp, orderStatus);
    this.status.set(
        Record.create(5)
            .slot("orderId", orderId)
            .slot("customerId", customerId)
            .slot("products", orderDetails.get("products"))
            .slot("status", orderStatus)
            .slot("timestamp", timestamp)
    );
    joinCustomer(customerId);
    joinStore();
  }

  private void progressOrder(final Value orderDetails) {
    final long timestamp = System.currentTimeMillis();

    final String currentOrderStatus = this.status.get().get("status").stringValue();
    final String newOrderStatus = orderDetails.get("status").isDefined() ? orderDetails.get("status").stringValue() : nextOrderStatus(currentOrderStatus);
    if (newOrderStatus != null && newOrderStatus.equals(currentOrderStatus)) {
      return; // No change
    }

    this.statusHistory.put(timestamp, newOrderStatus);
    this.status.set(
        this.status.get()
            .updated("status", newOrderStatus)
            .updated("timestamp", timestamp)
    );
  }

  private String nextOrderStatus(final String currentOrderStatus) {
    for (int i = 0; i < ORDER_STATUSES.length - 1; i++) {
      if (ORDER_STATUSES[i].equals(currentOrderStatus)) {
        return ORDER_STATUSES[i + 1];
      }
    }
    return null;
  }

  private void joinCustomer(final String customerId) {
    this.command("/customer/" + customerId, "addOrder", Uri.form().mold(nodeUri()).toValue());
  }

  private void joinStore() {
    this.command("/store/main", "addOrder", Uri.form().mold(nodeUri()).toValue());
  }


}
