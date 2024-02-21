package swim.retail.model;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import swim.structure.Form;
import swim.structure.Record;
import swim.structure.Value;
import static swim.retail.model.OrderStatus.ORDER_PICKED_UP_COMPLETED;
import static swim.retail.model.OrderStatus.ORDER_PLACED;
import static swim.retail.model.OrderStatus.ORDER_PROCESSED;
import static swim.retail.model.OrderStatus.ORDER_READY;

public class Orders {

  public static Value computeStoreStatus(Map<Value, Value> orders, Value currentStatus) {
    final Map<String, Map<String, Integer>> statusOrders = computeStatusOrders(orders);
    final Value productStatuses = computePickedUpOrders(statusOrders, currentStatus);
    return Record.create()
            .slot("orders", Form.forMap(Form.forString(), Form.forMap(Form.forString(), Form.forInteger())).mold(statusOrders).toValue())
            .slot("pickedUpOrders", productStatuses);
  }

  public static Value computeCustomerStatus(Map<Value, Value> orders, Value currentStatus) {
    final Map<String, Map<String, Integer>> statusOrders = computeStatusOrders(orders);
    final Value productStatuses = computePickedUpOrders(statusOrders, currentStatus);
    return Record.create()
            .slot("notify", isNotifyCustomer(statusOrders))
            .slot("orders", Form.forMap(Form.forString(), Form.forMap(Form.forString(), Form.forInteger())).mold(statusOrders).toValue())
            .slot("pickedUpOrders", productStatuses);
  }

  private static Map<String, Map<String, Integer>> computeStatusOrders(Map<Value, Value> orders) {
    final Map<String, Map<String, Integer>> statusOrders = new HashMap<>();
    for (Value orderId : orders.keySet()) {
      final Value orderStatus = orders.get(orderId);
      final String status = orderStatus.get("status").stringValue("");
      final Map<String, Integer> statusOrder = statusOrders.getOrDefault(status, new HashMap<>());
      orderStatus.get("products").forEach(item ->
            statusOrder.put(
                  item.key().stringValue(),
                  statusOrder.getOrDefault(item.key().stringValue(), 0) + item.intValue(0))
      );
      statusOrders.put(status, statusOrder);
    }
    return statusOrders;
  }

  private static Value computePickedUpOrders(Map<String, Map<String, Integer>> statusOrders, Value currentStatus) {
    Value currentProductsStatusCounts = currentStatus.get("pickedUpOrders");
    final Map<String, Integer> orders = statusOrders.getOrDefault(ORDER_PICKED_UP_COMPLETED, Collections.emptyMap());
    for (String productId: orders.keySet()) {
      currentProductsStatusCounts = currentProductsStatusCounts.updatedSlot(productId,
            currentProductsStatusCounts.get(productId).intValue(0) + orders.getOrDefault(productId, 0));
    }
    return currentProductsStatusCounts;
  }

  private static boolean isNotifyCustomer(Map<String, Map<String, Integer>> statusOrders) {
    int placedProcessedCount = 0, readyCount = 0;
    for (String status: statusOrders.keySet()) {
      if (status.equals(ORDER_PLACED) || status.equals(ORDER_PROCESSED)  || status.equals(ORDER_READY)) {
        final Map<String, Integer> orders = statusOrders.get(status);
        for (Integer count: orders.values()) {
          if (status.equals(ORDER_READY)) {
            readyCount += count;
          } else {
            placedProcessedCount += count;
          }
        }
      }
    }
    return placedProcessedCount == 0 && readyCount > 0;
  }
}
