package swim.retail.agent;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import swim.api.SwimLane;
import swim.api.agent.AbstractAgent;
import swim.api.lane.*;
import swim.structure.Form;
import swim.structure.Record;
import swim.structure.Value;
import swim.uri.Uri;
import static swim.retail.model.OrderStatus.ORDER_PLACED;
import static swim.retail.model.OrderStatus.ORDER_PROCESSED;
import static swim.retail.model.OrderStatus.ORDER_READY;

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
    final Map<String, Map<String, Integer>> statusOrders = new HashMap<>();
    for (Value orderId: orders.keySet()) {
      final Value orderStatus = this.orders.get(orderId);
      if (!orderStatus.isDefined()) {
        this.orders.remove(orderId);
        continue;
      }
      final String status = orderStatus.get("status").stringValue("");

      if (!status.equals("")) {
        final Map<String, Integer> statusOrder = statusOrders.getOrDefault(status, new HashMap<>());
        orderStatus.get("products").forEach(item ->
              statusOrder.put(
                    item.key().stringValue(),
                    statusOrder.getOrDefault(item.key().stringValue(), 0) + item.intValue(0))
        );
        statusOrders.put(status, statusOrder);
      }
    }
    final boolean notifyCustomer = computeCustomerStatus(statusOrders);
    final Value customerStatus =
          Record.create().slot("notify", notifyCustomer)
                .appended(Form.forMap(Form.forString(), Form.forMap(Form.forString(), Form.forInteger())).mold(statusOrders).toValue());
    this.status.set(customerStatus);
  }

  private boolean computeCustomerStatus(Map<String, Map<String, Integer>> statusOrders) {
    int placedProcessedCount = 0, readyCount = 0;
    for (String status: statusOrders.keySet()) {
      if (status.equals(ORDER_PLACED) || status.equals(ORDER_PROCESSED)  || status.equals(ORDER_READY)) {
        final Map<String, Integer> orders = statusOrders.get(status);
        for (Integer count: orders.values()) {
          if (status.equals(ORDER_READY)) {
            readyCount += count;
          } else {
            placedProcessedCount += count;
          }
        }
      }
    }
    return placedProcessedCount == 0 && readyCount > 0;
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
