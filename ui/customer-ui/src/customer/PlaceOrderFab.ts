import { ButtonStack, ButtonStackObserver } from "@swim/button";
import { MainController } from ".";
import { OrderStatus } from "../types";
import { Transform } from "@swim/math";
import { VectorIcon } from "@swim/graphics";
import { Class } from "@swim/util";


export class PlaceOrderFab extends ButtonStack {
  declare observerType: Class<ButtonStackObserver>;

  protected override willMount(): void {
    // override default ButtonStack presenting behavior by removing custom icon
    this.presence.willPresent = function(): void {
      this.owner.callObservers("viewWillPresent", this.owner);
      const buttonView = this.owner.button.view;
      if (buttonView !== null) {
        const timing = this.timing;
        buttonView.icons.deleteViews();
        buttonView.icon.push(this.owner.closeIcon, timing ?? void 0);
      }
      this.owner.modal.present();
    }

    const prevDidPresent = this.presence.didPresent.bind(this.presence);
    // override default ButtonStack presenting behavior by removing custom icon
    this.presence.didPresent = function(): void {
      prevDidPresent();
      const buttonView = this.owner.button.view;
      if (buttonView !== null) {
        buttonView.icons.deleteViews();
        buttonView.icon.push(this.owner.closeIcon);
      }
    }

    // override default ButtonStack dismissing behavior by replacing close icon with custom icon
    this.presence.willDismiss = function(): void {
      this.owner.callObservers("viewWillDismiss", this.owner);
      const buttonView = this.owner.button.view;
      if (buttonView !== null && buttonView.icons.viewCount > 0) {
        const timing = this.timing;
        buttonView.icons.deleteViews();
        buttonView.icon.push(VectorIcon.create(24, 24, 'M11,13L5,13L5,11L11,11L11,5L13,5L13,11L19,11L19,13L13,13L13,19L11,19Z'), timing ?? void 0).set({
          style: {
            transform: Transform.parse("scale(1.25,1.25)"),
          },
          classList: ['svg-container-view'],
        });
      }
    }
  }

  protected override onMount(): void {
    super.onMount();

    // style PlaceOrderFab ButtonStack
    this.setStyle('position', 'absolute');
    this.setStyle('bottom', '24px');
    this.setStyle('right', '24px');

    // style button
    const buttonView = this.button.attachView();
    buttonView.set({
      style: {
        width: '100%',
        height: '100%',
        backgroundColor: MainController.orderStatusColors[OrderStatus.orderPlaced],
      },
      classList: ['button-stack-view'],
    });

    // attach presence toggle behavior to button click
    if (!buttonView.node.onclick) {
      buttonView.node.onclick = () => {
        this.presence.toggle();
      };
    }

    // show custom icon when PlaceOrderFab is first mounted
    buttonView.icon.push(VectorIcon.create(24, 24, 'M11,13L5,13L5,11L11,11L11,5L13,5L13,11L19,11L19,13L13,13L13,19L11,19Z'), false);
    const iconView = buttonView.icon.attachView();
    iconView.set({
      style: {
        transform: Transform.parse("scale(1.25,1.25)"),
      },
      classList: ['svg-container-view'],
    });
  }
}
