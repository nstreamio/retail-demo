package swim.retail;

import swim.actor.ActorSpace;
import swim.api.plane.AbstractPlane;
import swim.kernel.Kernel;
import swim.server.ServerLoader;

public class RetailPlane extends AbstractPlane {

  public RetailPlane() {

  }

  public static void main(String[] args) {
    final Kernel kernel = ServerLoader.loadServer();
    final ActorSpace space = (ActorSpace) kernel.getSpace("retail");

    kernel.start();
    System.out.println("Running Retail Plane...");
    kernel.run();
  }

}
