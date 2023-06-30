package swim.retail360;

import swim.api.SwimLane;
import swim.api.agent.AbstractAgent;
import swim.api.lane.*;
import swim.structure.Record;
import swim.structure.Value;

import java.util.UUID;

public class CustomerAgent extends AbstractAgent {

  public CustomerAgent() {}

  @SwimLane("id")
  private final ValueLane<String> id = this.<String>valueLane();

  @SwimLane("name")
  private final ValueLane<String> name = this.<String>valueLane();

  @SwimLane("orders")
  private final JoinValueLane<String, Value> orders = this.<String, Value>joinValueLane()
      .didUpdate((orderId, newStatus, oldStatus) -> {
        logMessage("order " + orderId + " changed to " + newStatus + ".");
      });

  @SwimLane("placeOrder")
  public final CommandLane<Value> placeOrder = this.<Value>commandLane()
      .onCommand(v -> {
        int quantityA = v.get("productA").intValue(0);
        int quantityB = v.get("productB").intValue(0);
        int quantityC = v.get("productC").intValue(0);
        int quantityD = v.get("productD").intValue(0);
        int quantityE = v.get("productE").intValue(0);

        if (quantityA > 0 || quantityB > 0 || quantityC > 0 || quantityD > 0 || quantityE > 0) {
          Record orderInfo = Record.of()
              .slot("customerId", this.nodeUri().pathName())
              .slot("customerName", this.name.get());

          if (quantityA > 0) {
            orderInfo.slot("quantityA", quantityA);
          }

          if (quantityB > 0) {
            orderInfo.slot("quantityB", quantityB);
          }

          if (quantityC > 0) {
            orderInfo.slot("quantityC", quantityC);
          }

          if (quantityD > 0) {
            orderInfo.slot("quantityD", quantityD);
          }

          if (quantityE > 0) {
            orderInfo.slot("quantityE", quantityE);
          }

          String orderId = UUID.randomUUID().toString();

          this.context.command("/order/" + orderId, "placeOrder", orderInfo);
        }
      });

  @SwimLane("pickupOrder")
  public final CommandLane<Value> pickupOrder = this.<Value>commandLane()
      .onCommand(v -> {
        final String orderId = v.get("orderId").stringValue();
        if (orders.get(orderId).isDefined()) {
          final String status = orders.get(orderId).get("eventName").stringValue();
          if (status.equals("readyForPickup")) {
            context.command("/order/" + orderId, "updateOrder", Value.empty());
          }
        }
      });

  private void logMessage(Object o) {
    System.out.println("[" + nodeUri() + "] " + o);
  }

}
