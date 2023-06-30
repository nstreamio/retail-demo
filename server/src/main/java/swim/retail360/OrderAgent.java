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

  @SwimLane("placeOrder")
  public final CommandLane<Value> placeOrder = this.<Value>commandLane()
      .onCommand(v -> {
        logMessage("placeOrder: commanded with " + Recon.toString(v));
        if (v.get("customerId").isDefined() && v.get("customerName").isDefined()) {
          this.id.set(this.nodeUri().pathName());
          this.customerId.set(v.get("customerId").stringValue());
          this.customerName.set(v.get("customerName").stringValue());

          if (v.get("productA").isDefined()) {
            this.productA.set(v.get("productA").intValue());
          }
          if (v.get("productB").isDefined()) {
            this.productA.set(v.get("productB").intValue());
          }
          if (v.get("productC").isDefined()) {
            this.productA.set(v.get("productC").intValue());
          }
          if (v.get("productD").isDefined()) {
            this.productA.set(v.get("productD").intValue());
          }
          if (v.get("productE").isDefined()) {
            this.productA.set(v.get("productE").intValue());
          }

          long ts = System.currentTimeMillis();
          this.statusHistory.put(ts, "orderPlaced");
          this.status.set(Record.of().slot("eventTime", ts).slot("eventName", "orderPlaced"));
        }
      });

  @SwimLane("updateOrder")
  public final CommandLane<Value> updateOrder = this.<Value>commandLane()
      .onCommand(v -> {
        if (status.get().get("eventName").equals("orderPlaced")) {
          long ts = System.currentTimeMillis();
          this.statusHistory.put(ts, "orderProcessed");
          this.status.set(Record.of().slot("eventTime", ts).slot("eventName", "orderProcessed"));
        }

        if (status.get().get("eventName").equals("orderProcessed")) {
          long ts = System.currentTimeMillis();
          this.statusHistory.put(ts, "readyForPickup");
          this.status.set(Record.of().slot("eventTime", ts).slot("eventName", "readyForPickup"));
        }

        if (status.get().get("eventName").equals("readyForPickup")) {
          long ts = System.currentTimeMillis();
          this.statusHistory.put(ts, "pickupCompleted");
          this.status.set(Record.of().slot("eventTime", ts).slot("eventName", "pickupCompleted"));
        }
      });

  private void logMessage(Object o) {
    System.out.println("[" + nodeUri() + "] " + o);
  }

}
