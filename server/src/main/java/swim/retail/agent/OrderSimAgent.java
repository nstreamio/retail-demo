package swim.retail.agent;

import swim.api.SwimLane;
import swim.api.agent.AbstractAgent;
import swim.api.lane.ValueLane;
import swim.concurrent.TimerRef;
import swim.structure.Value;
import swim.uri.Uri;

public class OrderSimAgent extends AbstractAgent {

  private static final long TIMER_FREQUENCY_MS = 2000;
  private static final double CHANCE_TO_PROGRESS_ORDER = 0.1;

  private static final String ORDER_PICKED_UP_COMPLETED = "pickupCompleted";

  private TimerRef timer;

  public OrderSimAgent() {}

  @SwimLane("status")
  private final ValueLane<Value> status = valueLane();

  private String getCurrentStatus() {
    return this.status.get().get("status").stringValue();
  }

  private void timerFunction() {
    if (!ORDER_PICKED_UP_COMPLETED.equals(getCurrentStatus()) && Math.random() < CHANCE_TO_PROGRESS_ORDER) {
      this.command(this.nodeUri(), Uri.parse("updateOrder"), Value.absent());
    }

    reschedule();
  }

  private void reschedule() {
    this.timer = setTimer(TIMER_FREQUENCY_MS, this::timerFunction);
  }

  @Override
  public void didStart() {
    reschedule();
  }

}
