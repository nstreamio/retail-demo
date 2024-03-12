package swim.retail.agent;

import java.util.UUID;
import swim.api.SwimLane;
import swim.api.agent.AbstractAgent;
import swim.api.lane.CommandLane;
import swim.api.lane.JoinValueLane;
import swim.api.lane.ValueLane;
import swim.retail.model.Orders;
import swim.structure.Value;
import swim.uri.Uri;
import static swim.retail.model.OrderStatus.ORDER_PICKED_UP_COMPLETED;

public class CustomerAgent extends AbstractAgent {

  public CustomerAgent() {}

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
        if (this.orders.isEmpty() && this.getAgent("sim") == null) {
            removeCustomer();
        }
      });

    private void removeCustomer() {
        this.command("/store/main", "removeCustomer", Uri.form().mold(nodeUri()).toValue());
    }

    @SwimLane("addOrder")
  public final CommandLane<Value> addOrder = this.<Value>commandLane()
      .onCommand(v -> this.orders.downlink(v)
          .nodeUri(Uri.form().cast(v))
          .laneUri("status")
          .open());

  private void updateStatus() {
    final Value customerOrderStatus = Orders.computeCustomerStatus(this.orders, this.status.get());
    this.status.set(customerOrderStatus);
  }

  @SwimLane("placeOrder")
  public final CommandLane<Value> placeOrder = this.<Value>commandLane()
      .onCommand(v -> {
        final String orderId = UUID.randomUUID().toString();
        this.command("/order/" + orderId, "placeOrder", v.updated("customerId", this.nodeUri().pathName()));
        this.joinStore();
      });

  // invoked only for simulated customers
  @SwimLane("startSim")
  public final CommandLane<Value> startSim = this.<Value>commandLane()
      .onCommand(v -> openAgent("sim", CustomerSimAgent.class));

  private void joinStore() {
    this.command("/store/main", "addCustomer", Uri.form().mold(nodeUri()).toValue());
  }

  @Override
  public void didStart() {
    info(nodeUri() + " didStart");
    joinStore();
  }
    
}
