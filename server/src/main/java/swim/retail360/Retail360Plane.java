package swim.retail360;

import swim.actor.ActorSpace;
import swim.api.plane.AbstractPlane;
import swim.kernel.Kernel;
import swim.server.ServerLoader;

public class Retail360Plane extends AbstractPlane {

  public Retail360Plane() {}

  public static void main(String[] args) {
    final Kernel kernel = ServerLoader.loadServer();
    final ActorSpace space = (ActorSpace) kernel.getSpace("retail360");

    kernel.start();
    System.out.println("Running Retail-360 plane...");
    kernel.run();
  }

}
