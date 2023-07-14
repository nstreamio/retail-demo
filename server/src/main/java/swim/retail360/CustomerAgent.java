package swim.retail360;

import swim.api.SwimLane;
import swim.api.agent.AbstractAgent;
import swim.api.lane.*;
import swim.structure.Form;
import swim.structure.Record;
import swim.structure.Value;
import swim.structure.form.MapForm;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

public class CustomerAgent extends AbstractAgent {

  public CustomerAgent() {}

  @SwimLane("id")
  private final ValueLane<String> id = this.<String>valueLane()
      .didSet((nv, ov) -> this.status.set(this.status.get().updated("id", nv)));

  @SwimLane("name")
  private final ValueLane<String> name = this.<String>valueLane()
      .didSet((nv, ov) -> this.status.set(this.status.get().updated("name", nv)));

  @SwimLane("status")
  private final ValueLane<Value> status = this.<Value>valueLane();

  @SwimLane("orders")
  private final JoinValueLane<String, Value> orders = this.<String, Value>joinValueLane()
      .didUpdate((orderId, newStatus, oldStatus) -> {
        // logMessage("order " + orderId + " changed to " + newStatus + ".");
      });

  @SwimLane("state")
  private final JoinValueLane<String, Value> state = this.<String, Value>joinValueLane()
      .didUpdate((orderId, newStatus, oldStatus) -> {
        updateStatus();
      });

  private void updateStatus() {
    final int orderCount = this.state.size();
    final Map<String, Integer> orderStatusCount = new HashMap<>();
    Long mostRecentEvent = null;

    for (final Value orderState: state.values()) {
      if (orderState.get("ts").isDefined()) mostRecentEvent = orderState.get("ts").longValue();

      final String eventType = orderState.get("status").get("eventName").stringValue(null);
      if (eventType != null) {
        orderStatusCount.put(eventType, orderStatusCount.getOrDefault(eventType, 0) + 1);
      }
    }

    this.status.set(
        this.status.get()
            .updated("orderCount", orderCount)
            .updated("lastEvent", mostRecentEvent)
            .updated("orderStates", Form.forMap(Form.forString(), Form.forInteger()).mold(orderStatusCount).toValue())
    );

  }

  @SwimLane("placeOrder")
  public final CommandLane<Value> placeOrder = this.<Value>commandLane()
      .onCommand(v -> {
        // logMessage("placeOrder invoked with " + Recon.toString(v));
        int quantityA = v.get("productA").intValue(0);
        int quantityB = v.get("productB").intValue(0);
        int quantityC = v.get("productC").intValue(0);
        int quantityD = v.get("productD").intValue(0);
        int quantityE = v.get("productE").intValue(0);
        String orderId = v.get("orderId").stringValue("");

        if (quantityA > 0 || quantityB > 0 || quantityC > 0 || quantityD > 0 || quantityE > 0) {
          Record orderInfo = Record.of()
              .slot("customerId", this.nodeUri().pathName())
              .slot("customerName", this.name.get());

          if (quantityA > 0) {
            orderInfo.slot("productA", quantityA);
          }

          if (quantityB > 0) {
            orderInfo.slot("productB", quantityB);
          }

          if (quantityC > 0) {
            orderInfo.slot("productC", quantityC);
          }

          if (quantityD > 0) {
            orderInfo.slot("productD", quantityD);
          }

          if (quantityE > 0) {
            orderInfo.slot("productE", quantityE);
          }

          if (orderId.equals(""))
            orderId = UUID.randomUUID().toString();

          this.context.command("/order/" + orderId, "placeOrder", orderInfo);
          orders.downlink(orderId).nodeUri("/order/" + orderId).laneUri("status").open();
          state.downlink(orderId).nodeUri("/order/" + orderId).laneUri("state").open();
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

  @SwimLane("initialize")
  public final CommandLane<Value> initialize = this.<Value>commandLane()
      .onCommand(v -> {
        if (v.get("name").isDefined()) {
          this.name.set(v.get("name").stringValue());
          this.id.set(this.nodeUri().pathName());
        }
      });

  private void logMessage(Object o) {
    System.out.println("[" + nodeUri() + "] " + o);
  }

  @Override
  public void didStart() {
    this.id.set(getProp("id").stringValue("unknown"));
  }

}
