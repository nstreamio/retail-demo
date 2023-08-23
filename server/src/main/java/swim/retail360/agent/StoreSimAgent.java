package swim.retail360.agent;

import swim.api.agent.AbstractAgent;
import swim.structure.Value;

public class StoreSimAgent extends AbstractAgent {

  private static final String[] CUSTOMER_NAMES = {
      "Customer0"
  };

  public StoreSimAgent() {}

  @Override
  public void didStart() {
    for (final String customerId : CUSTOMER_NAMES) {
      this.command("/customer/" + customerId, "startSim", Value.absent());
    }
  }

}
