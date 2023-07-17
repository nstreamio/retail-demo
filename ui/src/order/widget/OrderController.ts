// Copyright 2015-2022 Swim.inc
// All rights reserved.

import { Property } from "@swim/component";
import { TextCellView } from "@swim/table";
import {TimeSeriesController} from "@swim/widget";

/** @public */
export class OrderController extends TimeSeriesController {

    @Property<TimeSeriesController["title"]>({
        valueType: String,
        value: "",
        extends: true,
        didSetValue(title: string): void {
            this.owner.callObservers("controllerDidSetTitle", title, this.owner);
            (this.owner.nameCell.view as TextCellView).content.setText(title);
        },
    })
    override readonly title!: Property<this, string> & TimeSeriesController["title"];    

}
