package swim.retail360.agent;

import java.util.HashMap;
import java.util.Map;
import swim.api.SwimLane;
import swim.api.agent.AbstractAgent;
import swim.api.lane.CommandLane;
import swim.api.lane.JoinValueLane;
import swim.api.lane.ValueLane;
import swim.observable.function.DidRemoveKey;
import swim.observable.function.DidUpdateKey;
import swim.streamlet.In;
import swim.structure.Form;
import swim.structure.Value;
import swim.uri.Uri;

public class StoreAgent extends AbstractAgent {

  public StoreAgent() {}

  @SwimLane("status")
  private final ValueLane<Value> status = this.<Value>valueLane();

  @SwimLane("orders")
  private final JoinValueLane<Value, Value> orders = this.<Value, Value>joinValueLane()
        .didUpdate((key, newValue, oldValue) -> updateStatus())
        .didRemove((key, oldValue) -> updateStatus());

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

  @SwimLane("addOrder")
  public final CommandLane<Value> addOrder = this.<Value>commandLane()
      .onCommand(v -> this.orders.downlink(v)
          .nodeUri(Uri.form().cast(v))
          .laneUri("status")
          .open());

  @SwimLane("customers")
  private final JoinValueLane<Value, Value> customers = this.<Value, Value>joinValueLane();

  @SwimLane("addCustomer")
  public final CommandLane<Value> addCustomer = this.<Value>commandLane()
      .onCommand(v -> this.customers.downlink(v)
          .nodeUri(Uri.form().cast(v))
          .laneUri("status")
          .open());

  @Override
  public void didStart() {
    info(nodeUri() + " didStart");
    openAgent("sim", StoreSimAgent.class);
  }

}
