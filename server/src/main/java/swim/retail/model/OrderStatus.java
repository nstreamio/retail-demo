package swim.retail.model;

public class OrderStatus {

  public static final String ORDER_PLACED = "orderPlaced";
  public static final String ORDER_PROCESSED = "orderProcessed";
  public static final String ORDER_READY = "readyForPickup";
  public static final String ORDER_PICKED_UP_COMPLETED = "pickupCompleted";

  public static final String[] ORDER_STATUSES = {ORDER_PLACED, ORDER_PROCESSED, ORDER_READY, ORDER_PICKED_UP_COMPLETED};

}
