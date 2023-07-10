package swim.retail360;

import swim.api.SwimLane;
import swim.api.agent.AbstractAgent;
import swim.api.lane.CommandLane;
import swim.api.lane.MapLane;
import swim.api.lane.ValueLane;
import swim.recon.Recon;
import swim.structure.Record;
import swim.structure.Value;

public class OrderAgent extends AbstractAgent {

  public OrderAgent() {}

  @SwimLane("id")
  private final ValueLane<String> id = this.<String>valueLane();

  @SwimLane("productA")
  private final ValueLane<Integer> productA = this.<Integer>valueLane();

  @SwimLane("productB")
  private final ValueLane<Integer> productB = this.<Integer>valueLane();

  @SwimLane("productC")
  private final ValueLane<Integer> productC = this.<Integer>valueLane();

  @SwimLane("productD")
  private final ValueLane<Integer> productD = this.<Integer>valueLane();

  @SwimLane("productE")
  private final ValueLane<Integer> productE = this.<Integer>valueLane();

  @SwimLane("customerId")
  private final ValueLane<String> customerId = this.<String>valueLane();

  @SwimLane("customerName")
  private final ValueLane<String> customerName = this.<String>valueLane();

  @SwimLane("statusHistory")
  private final MapLane<Long, String> statusHistory = this.<Long, String>mapLane();

  @SwimLane("status")
  private final ValueLane<Value> status = this.<Value>valueLane();

  @SwimLane("state")
  private final ValueLane<Value> state = this.<Value>valueLane();

  @SwimLane("placeOrder")
  public final CommandLane<Value> placeOrder = this.<Value>commandLane()
      .onCommand(v -> {
        // logMessage("placeOrder: commanded with " + Recon.toString(v));
        if (v.get("customerId").isDefined() && v.get("customerName").isDefined()) {
          this.id.set(this.nodeUri().pathName());
          this.customerId.set(v.get("customerId").stringValue());
          this.customerName.set(v.get("customerName").stringValue());
          Record products = Record.of();

          if (v.get("productA").isDefined()) {
            this.productA.set(v.get("productA").intValue());
            products.slot("productA", v.get("productA").intValue());
          }
          if (v.get("productB").isDefined()) {
            this.productB.set(v.get("productB").intValue());
            products.slot("productB", v.get("productB").intValue());
          }
          if (v.get("productC").isDefined()) {
            this.productC.set(v.get("productC").intValue());
            products.slot("productC", v.get("productC").intValue());
          }
          if (v.get("productD").isDefined()) {
            this.productD.set(v.get("productD").intValue());
            products.slot("productD", v.get("productD").intValue());
          }
          if (v.get("productE").isDefined()) {
            this.productE.set(v.get("productE").intValue());
            products.slot("productE", v.get("productE").intValue());
          }

          long ts = System.currentTimeMillis();
          this.statusHistory.put(ts, "orderPlaced");
          Value newStatus = Record.of().slot("eventTime", ts).slot("eventName", "orderPlaced");
          this.status.set(newStatus);
          Record orderDetail = Record.of();
          orderDetail.slot("customerId", v.get("customerId").stringValue());
          orderDetail.slot("orderId", this.nodeUri().pathName());
          orderDetail.slot("products", products);
          orderDetail.slot("ts", ts);
          orderDetail.slot("status", newStatus);
          this.state.set(orderDetail);
          this.command("/store/main", "addOrder", Record.of().slot("orderId", this.nodeUri().pathName()));
        }
      });

  @SwimLane("updateOrder")
  public final CommandLane<Value> updateOrder = this.<Value>commandLane()
      .onCommand(v -> {
        Record orderDetail = Record.of();
        long ts = System.currentTimeMillis();
        Value oldState = this.state.get();
        orderDetail.slot("customerId", oldState.get("customerId").stringValue());
        orderDetail.slot("orderId", this.nodeUri().pathName());
        orderDetail.slot("products", oldState.get("products"));
        orderDetail.slot("ts", ts);
        if (status.get().get("eventName").stringValue().equals("orderPlaced")) {
          this.statusHistory.put(ts, "orderProcessed");
          Record state = Record.of()
              .slot("customerId", oldState.get("customerId").stringValue())
              .slot("orderId", this.nodeUri().pathName())
              .slot("eventTime", ts)
              .slot("eventName", "orderProcessed");
          Value newStatus = Record.of().slot("eventTime", ts).slot("eventName", "orderProcessed");
          this.status.set(newStatus);
          orderDetail.slot("status", newStatus);
          this.state.set(orderDetail);
        }

        else if (status.get().get("eventName").stringValue().equals("orderProcessed")) {
          this.statusHistory.put(ts, "readyForPickup");
          Value newStatus = Record.of().slot("eventTime", ts).slot("eventName", "readyForPickup");
          this.status.set(newStatus);
          orderDetail.slot("status", newStatus);
          this.state.set(orderDetail);
        }

        else if (status.get().get("eventName").stringValue().equals("readyForPickup")) {
          this.statusHistory.put(ts, "pickupCompleted");
          Value newStatus = Record.of().slot("eventTime", ts).slot("eventName", "pickupCompleted");
          this.status.set(newStatus);
          orderDetail.slot("status", newStatus);
          this.state.set(orderDetail);
        }
      });

  private void logMessage(Object o) {
    System.out.println("[" + nodeUri() + "] " + o);
  }

}
