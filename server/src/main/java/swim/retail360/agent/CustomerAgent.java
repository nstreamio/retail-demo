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
    this.status.set(Form.forMap(Form.forString(), Form.forMap(Form.forString(), Form.forInteger())).mold(statusOrders).toValue());
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
