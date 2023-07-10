package swim.retail360;

import swim.api.SwimRoute;
import swim.api.agent.AgentRoute;
import swim.api.plane.AbstractPlane;
import swim.client.ClientRuntime;
import swim.kernel.Kernel;
import swim.server.ServerLoader;

public class Retail360Plane extends AbstractPlane {

  public Retail360Plane() {}

  @SwimRoute("/customer/:id")
  private AgentRoute<CustomerAgent> customerAgent;

  @SwimRoute("/order/:id")
  private AgentRoute<OrderAgent> orderAgent;

  @SwimRoute("/store/:id")
  private AgentRoute<StoreAgent> storeAgent;

  public static void main(String[] args) throws InterruptedException {
    final Kernel kernel = ServerLoader.loadServer();

    kernel.start();
    System.out.println("Running Retail-360 plane...");
    kernel.run();

    // Send data to the above Swim server. Could (and in practice, usually will)
    // be done in external processes instead
    final ClientRuntime client = new ClientRuntime();
    client.start();
    final Simulator sim = new Simulator(client, "warp://localhost:9001", 1);
    sim.run();
  }

}
