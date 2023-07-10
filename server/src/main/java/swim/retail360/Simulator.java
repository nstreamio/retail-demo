package swim.retail360;

import swim.api.ref.WarpRef;
import swim.recon.Recon;
import swim.structure.Record;
import swim.structure.Value;

import java.util.Random;
import java.util.UUID;

class OrderSimState {
  public String orderId;
  public String orderStatus;

  public String toString() {
    return "{" + "orderId: " + orderId + "; orderStatus: " + orderStatus + "}";
  }
}

class CustomerSimState {
  public String name;
  public Integer status;
  public OrderSimState orderStateA;
  public OrderSimState orderStateB;

  public String toString() {
    return "{" +
        "name: " + this.name + "; status: " + this.status + "; orderStateA: " + orderStateA + "; orderStateB: " + orderStateB + "}";
  }
}

class Simulator {

  private final WarpRef ref;
  private final String hostUri;
  private Integer numCustomers = 0;

  private final int NO_ORDERS = 0;
  private final int ONE_ORDER_PLACED = 1;
  private final int ONE_ORDER_PROCESSED = 2;
  private final int ONE_ORDER_READY = 3;
  private final int TWO_ORDERS_PLACED = 4;
  private final int ONE_ORDER_PLACED_ONE_PROCESSED = 5;
  private final int ONE_ORDER_PLACED_ONE_READY = 6;
  private final int ONE_ORDER_PLACED_ONE_HELD = 7;
  private final int TWO_ORDERS_PROCESSED = 8;
  private final int ONE_ORDER_PROCESSED_ONE_READY = 9;
  private final int ONE_ORDER_PROCESSED_ONE_HELD = 10;
  private final int TWO_ORDERS_READY = 11;

  private final double TRANSITION_TO_ORDER_PLACED = 0.25;
  private final double TRANSITION_TO_ORDER_PROCESSED = 0.35;
  private final double TRANSITION_TO_ORDER_READY = 0.10;
  private final double TRANSITION_TO_ORDER_PICKUP = 0.20;

  private CustomerSimState[] customerStates;
  private Random random;

  Simulator(WarpRef ref, String hostUri, Integer numCustomers) {
    this.ref = ref;
    this.hostUri = hostUri;
    this.numCustomers = numCustomers;
    this.customerStates = new CustomerSimState[numCustomers];
    this.random = new Random();

    for (int i = 0; i < numCustomers; ++i) {
      this.customerStates[i] = new CustomerSimState();
      this.customerStates[i].name = "Customer" + Integer.toHexString(i);
      this.customerStates[i].status = NO_ORDERS;
    }
  }

  void generateCustomers() {
    // System.out.println(("generateCustomers"));
    for (int i = 0; i < this.numCustomers; ++i) {
      CustomerSimState state = this.customerStates[i];
      Value params = Record.of().slot("customerName", state.name);
      this.ref.command(this.hostUri, "/customer/" + state.name, "initialize", params);
    }
  }

  void placeCustomerOrder(CustomerSimState state) {
    // System.out.println(("placeCustomerOrder " + state.name + " " + state.status));
    Record params = Record.of();
    int perm = 0;
    String[] products = new String[] {"productA", "productB", "productC", "productD", "productE"};
    Boolean productAdded = false;
    String orderId = UUID.randomUUID().toString();

    params.slot("orderId", orderId);

    OrderSimState orderState = new OrderSimState();
    orderState.orderId = orderId;
    orderState.orderStatus = "orderPlaced";

    if (state.orderStateA == null) {
      state.orderStateA = orderState;
    } else {
      state.orderStateB = orderState;
    }

    while (!productAdded) {
      for (int i = 0; i < 5; ++i) {
        if (Math.random() < 0.15) {
          int quantity = this.random.nextInt(4) + 1;
          params.slot(products[i], quantity);
          productAdded = true;
        }
      }
    }

    // System.out.println(state.name + " -- " + Recon.toString(params));

    this.ref.command(this.hostUri, "/customer/" + state.name, "placeOrder", params);
  }

  void updateOrderToProcessed(CustomerSimState state) {
    // System.out.println(("updateOrderToProcessed " + state));
    String orderId = state.orderStateA != null && state.orderStateA.orderStatus.equals("orderPlaced") ? state.orderStateA.orderId : state.orderStateB.orderId;
    this.ref.command(this.hostUri, "/order/" + orderId, "updateOrder", Value.empty());

    if (state.orderStateA != null && state.orderStateA.orderStatus.equals("orderPlaced"))
      state.orderStateA.orderStatus = "orderProcessed";
    else
      state.orderStateB.orderStatus = "orderProcessed";
  }

  void updateOrderToReady(CustomerSimState state) {
    // System.out.println(("updateOrderToReady"));
    String orderId = state.orderStateA != null && state.orderStateA.orderStatus.equals("orderProcessed") ? state.orderStateA.orderId : state.orderStateB.orderId;
    this.ref.command(this.hostUri, "/order/" + orderId, "updateOrder", Value.empty());

    if (state.orderStateA != null && state.orderStateA.orderStatus.equals("orderProcessed"))
      state.orderStateA.orderStatus = "orderReady";
    else
      state.orderStateB.orderStatus = "orderReady";
  }

  void updateOrderToComplete(CustomerSimState state) {
    // System.out.println(("updateOrderToComplete -- " + state));
    String orderId = state.orderStateA != null && state.orderStateA.orderStatus.equals("orderReady") ? state.orderStateA.orderId : state.orderStateB.orderId;
    this.ref.command(this.hostUri, "/order/" + orderId, "updateOrder", Value.empty());

    if (state.orderStateA != null && state.orderStateA.orderStatus.equals("orderReady"))
      state.orderStateA = null;
    else
      state.orderStateB = null;
  }

  void run() throws InterruptedException {
    generateCustomers();
    int start = 0;

    while (true) {
      for (int i = start; i < numCustomers; ++i) {
        switch (customerStates[i].status) {
          case NO_ORDERS:
            if (Math.random() < TRANSITION_TO_ORDER_PLACED) {
              placeCustomerOrder(customerStates[i]);
              customerStates[i].status = ONE_ORDER_PLACED;
            }
            break;
          case ONE_ORDER_PLACED:
            if (Math.random() < TRANSITION_TO_ORDER_PROCESSED) {
              updateOrderToProcessed(customerStates[i]);
              customerStates[i].status = ONE_ORDER_PROCESSED;
            }
            if (Math.random() < TRANSITION_TO_ORDER_PLACED) {
              placeCustomerOrder(customerStates[i]);
              customerStates[i].status = customerStates[i].status == ONE_ORDER_PROCESSED ? ONE_ORDER_PLACED_ONE_PROCESSED : TWO_ORDERS_PLACED;
            }
            break;
          case ONE_ORDER_PROCESSED:
            if (Math.random() < TRANSITION_TO_ORDER_READY) {
              updateOrderToReady(customerStates[i]);
              customerStates[i].status = ONE_ORDER_READY;
            }
            if (Math.random() < TRANSITION_TO_ORDER_PLACED) {
              placeCustomerOrder(customerStates[i]);
              customerStates[i].status = customerStates[i].status == ONE_ORDER_READY ? ONE_ORDER_PLACED_ONE_READY : ONE_ORDER_PLACED_ONE_PROCESSED;
            }
            break;
          case ONE_ORDER_READY:
            if (Math.random() < TRANSITION_TO_ORDER_PICKUP) {
              updateOrderToComplete(customerStates[i]);
              customerStates[i].status = NO_ORDERS;
            }
            else if (Math.random() < TRANSITION_TO_ORDER_PLACED) {
              placeCustomerOrder(customerStates[i]);
              customerStates[i].status = customerStates[i].status == NO_ORDERS ? ONE_ORDER_PLACED : ONE_ORDER_PLACED_ONE_READY;
            }
            break;
          case TWO_ORDERS_PLACED:
            if (Math.random() < TRANSITION_TO_ORDER_PROCESSED) {
              updateOrderToProcessed(customerStates[i]);
              customerStates[i].status = ONE_ORDER_PLACED_ONE_PROCESSED;
            }
            if (Math.random() < TRANSITION_TO_ORDER_PROCESSED) {
              updateOrderToProcessed(customerStates[i]);
              customerStates[i].status = customerStates[i].status == ONE_ORDER_PLACED_ONE_PROCESSED ? TWO_ORDERS_PROCESSED : ONE_ORDER_PLACED_ONE_PROCESSED;
            }
            break;
          case ONE_ORDER_PLACED_ONE_PROCESSED:
            if (Math.random() < TRANSITION_TO_ORDER_PROCESSED) {
              updateOrderToProcessed(customerStates[i]);
              customerStates[i].status = TWO_ORDERS_PROCESSED;
            }
            if (Math.random() < TRANSITION_TO_ORDER_READY) {
              updateOrderToReady(customerStates[i]);
              customerStates[i].status = customerStates[i].status == TWO_ORDERS_PROCESSED ? ONE_ORDER_PROCESSED_ONE_HELD : ONE_ORDER_PLACED_ONE_HELD;
            }
            break;
          case ONE_ORDER_PLACED_ONE_READY:
            if (Math.random() < TRANSITION_TO_ORDER_PROCESSED) {
              updateOrderToProcessed(customerStates[i]);
              customerStates[i].status = ONE_ORDER_PROCESSED_ONE_READY;
            }
            if (Math.random() < TRANSITION_TO_ORDER_PICKUP) {
              updateOrderToComplete(customerStates[i]);
              customerStates[i].status = customerStates[i].status == ONE_ORDER_PROCESSED_ONE_READY ? ONE_ORDER_PROCESSED : ONE_ORDER_PLACED;
            }
            break;
          case ONE_ORDER_PLACED_ONE_HELD:
            if (Math.random() < TRANSITION_TO_ORDER_PROCESSED) {
              updateOrderToProcessed(customerStates[i]);
              customerStates[i].status = ONE_ORDER_PROCESSED_ONE_HELD;
            }
            break;
          case TWO_ORDERS_PROCESSED:
            if (Math.random() < TRANSITION_TO_ORDER_READY) {
              updateOrderToReady(customerStates[i]);
              customerStates[i].status = ONE_ORDER_PROCESSED_ONE_READY;
            }
            if (Math.random() < TRANSITION_TO_ORDER_READY) {
              updateOrderToReady(customerStates[i]);
              customerStates[i].status = customerStates[i].status == ONE_ORDER_PROCESSED_ONE_READY ? TWO_ORDERS_READY : ONE_ORDER_PROCESSED_ONE_HELD;
            }
            break;
          case ONE_ORDER_PROCESSED_ONE_READY:
            if (Math.random() < TRANSITION_TO_ORDER_PICKUP) {
              updateOrderToComplete(customerStates[i]);
              customerStates[i].status = ONE_ORDER_PROCESSED;
            }
            if (Math.random() < TRANSITION_TO_ORDER_READY) {
              updateOrderToReady(customerStates[i]);
              customerStates[i].status = customerStates[i].status == ONE_ORDER_PROCESSED ? ONE_ORDER_READY : TWO_ORDERS_READY;
            }
            break;
          case ONE_ORDER_PROCESSED_ONE_HELD:
            if (Math.random() < TRANSITION_TO_ORDER_READY) {
              updateOrderToReady(customerStates[i]);
              customerStates[i].status = TWO_ORDERS_READY;
              customerStates[i].orderStateA.orderStatus = "orderReady";
              customerStates[i].orderStateB.orderStatus = "orderReady";
            }
            break;
          case TWO_ORDERS_READY:
            if (Math.random() < TRANSITION_TO_ORDER_PICKUP * 2) {
              updateOrderToComplete(customerStates[i]);
              updateOrderToComplete(customerStates[i]);
              customerStates[i].status = NO_ORDERS;
            }
            break;
        }
      }

      Thread.sleep(750);
    }
  }

}