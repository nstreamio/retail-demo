import QRCode from "@types/qrcode";

declare global {
  interface Window {
    QRCode: QRCode;
  }
}
