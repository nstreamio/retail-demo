package swim.retail360.agent;

import swim.api.SwimLane;
import swim.api.agent.AbstractAgent;
import swim.api.lane.CommandLane;
import swim.api.lane.JoinValueLane;
import swim.structure.Value;
import swim.uri.Uri;

public class StoreAgent extends AbstractAgent {

  public StoreAgent() {}

  @SwimLane("orders")
  private final JoinValueLane<Value, Value> orders = this.<Value, Value>joinValueLane();

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
