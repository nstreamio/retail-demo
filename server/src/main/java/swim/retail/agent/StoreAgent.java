package swim.retail.agent;

import swim.api.SwimLane;
import swim.api.agent.AbstractAgent;
import swim.api.lane.CommandLane;
import swim.api.lane.JoinValueLane;
import swim.api.lane.ValueLane;
import swim.retail.model.Orders;
import swim.structure.Value;
import swim.uri.Uri;
import static swim.retail.model.OrderStatus.ORDER_PICKED_UP_COMPLETED;

public class StoreAgent extends AbstractAgent {

  public StoreAgent() {}

  @SwimLane("status")
  private final ValueLane<Value> status = valueLane();

  @SwimLane("orders")
  private final JoinValueLane<Value, Value> orders = this.<Value, Value>joinValueLane()
        .didUpdate((orderId, newStatus, oldStatus) -> {
          updateStatus();
          final String orderStatus = newStatus.get("status").stringValue("");
          if (orderStatus.equals("") || orderStatus.equals(ORDER_PICKED_UP_COMPLETED)) {
            this.orders.remove(orderId);
          }
        });

  private void updateStatus() {
    final Value storeOrderStatus = Orders.computeStoreStatus(this.orders, this.status.get());
    this.status.set(storeOrderStatus);
  }

  @SwimLane("addOrder")
  public final CommandLane<Value> addOrder = this.<Value>commandLane()
      .onCommand(v -> this.orders.downlink(v)
          .nodeUri(Uri.form().cast(v))
          .laneUri("status")
          .open());

  @SwimLane("customers")
  private final JoinValueLane<Value, Value> customers = joinValueLane();

  @SwimLane("addCustomer")
  public final CommandLane<Value> addCustomer = this.<Value>commandLane()
      .onCommand(v -> this.customers.downlink(v)
          .nodeUri(Uri.form().cast(v))
          .laneUri("status")
          .open());

  @SwimLane("removeCustomer")
  public final CommandLane<Value> removeCustomer = this.<Value>commandLane()
          .onCommand(this.customers::remove);

  @Override
  public void didStart() {
    info(nodeUri() + " didStart");
    openAgent("sim", StoreSimAgent.class);
  }

}
