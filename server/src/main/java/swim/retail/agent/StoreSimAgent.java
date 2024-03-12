package swim.retail.agent;

import swim.api.agent.AbstractAgent;
import swim.structure.Value;

public class StoreSimAgent extends AbstractAgent {

  private static final String[] CUSTOMER_NAMES = {
      "Customer0", "Customer1"
  };

  public StoreSimAgent() {}

  @Override
  public void didStart() {
    for (final String customerId : CUSTOMER_NAMES) {
      this.command("/customer/" + customerId, "startSim", Value.absent());
    }
  }

}
