package swim.retail360;

import swim.api.SwimLane;
import swim.api.agent.AbstractAgent;
import swim.api.lane.CommandLane;
import swim.api.lane.JoinMapLane;
import swim.api.lane.JoinValueLane;
import swim.recon.Recon;
import swim.structure.Record;
import swim.structure.Value;

import java.util.UUID;

public class StoreAgent extends AbstractAgent {

  public StoreAgent() {}

  private void logMessage(Object o) {
    System.out.println("[" + nodeUri() + "] " + o);
  }

  @SwimLane("orders")
  private final JoinValueLane<String, Value> orders = this.<String, Value>joinValueLane()
      .didUpdate((orderId, newStatus, oldStatus) -> {
        // logMessage("order " + orderId + " changed to " + newStatus + ".");
      });

  @SwimLane("addOrder")
  public final CommandLane<Value> addOrder = this.<Value>commandLane()
      .onCommand(v -> {
        // logMessage("addOrder invoked with " + Recon.toString(v));
        String orderId = v.get("orderId").stringValue("");
        orders.downlink(orderId).nodeUri("/order/" + orderId).laneUri("state").open();
      });

  @SwimLane("customers")
  private final JoinMapLane<String, String, Value> customers = this.<String, String, Value>joinMapLane()
      .didUpdate((customerId, newState, oldState) -> {
        logMessage("customer state for " + customerId + " changed to " + Recon.toString(newState) + ".");
      });

  @SwimLane("addCustomer")
  public final CommandLane<Value> addCustomer = this.<Value>commandLane()
      .onCommand(v -> {
        // logMessage("addOrder invoked with " + Recon.toString(v));
        String customerId = v.get("customerId").stringValue("");
        customers.downlink(customerId).nodeUri("/customer/" + customerId).laneUri("state").open();
      });
}
