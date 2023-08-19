import { PanelController } from '@swim/ux';
import { View } from '@swim/view';

export class CustomerAppBarController extends PanelController {
  constructor() {
    super();
    this.initView();
  }

  initView() {
    this.parent?.appendChild(View, 'appBarContainer');
  }
}
