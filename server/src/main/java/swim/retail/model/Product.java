package swim.retail.model;

public enum Product {
  A(10), B(20), C(30);

  private final int cost;

  Product(int cost) {
    this.cost = cost;
  }

  public int getCost() {
    return cost;
  }
}
