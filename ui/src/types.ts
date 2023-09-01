export enum OrderType {
  OrderA = "A",
  OrderB = "B",
  OrderC = "C",
  Unknown = "Unknown",
}

export enum OrderStatus {
  orderPlaced = 'orderPlaced',
  orderProcessed = 'orderProcessed',
  readyForPickup = 'readyForPickup',
  pickupCompleted = 'pickupCompleted',
}

export type StoreStatus = Record<OrderStatus, Record<OrderType | 'total', { count: number, value: number}>>;
