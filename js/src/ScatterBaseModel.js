/* Copyright 2015 Bloomberg Finance L.P.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var d3 = require("d3");
var _ = require("underscore");
var markmodel = require("./MarkModel");

var ScatterBaseModel = markmodel.MarkModel.extend({

    defaults: function() {
        return _.extend({}, markmodel.MarkModel.prototype.defaults(), {
        _model_name: "ScatterBaseModel",
        _view_name: "ScatterBase",

        x: [],
        y: [],
        color: null,
        opacity: null,
        size: null,
        rotation: null,
        hovered_point: null,
        scales_metadata: {
            x: { orientation: "horizontal", dimension: "x" },
            y: { orientation: "vertical", dimension: "y" },
            color: { dimension: "color" },
            size: { dimension: "size" },
            opacity: { dimension: "opacity" },
            rotation: { dimension: "rotation" }
        },
        hovered_style: {},
        unhovered_style: {},
        colors: [],
        default_opacities: [],
        enable_move: false,
        enable_delete: false,
        restrict_x: false,
        restrict_y: false,
        update_on_move: false
        });
    },

    initialize: function() {
        // TODO: Normally, color, opacity and size should not require a redraw
        ScatterBaseModel.__super__.initialize.apply(this, arguments);
        this.on_some_change(["x", "y", "color", "opacity", "size", "rotation"], this.update_data, this);
        // FIXME: replace this with on("change:preserve_domain"). It is not done here because
        // on_some_change depends on the GLOBAL backbone on("change") handler which
        // is called AFTER the specific handlers on("change:foobar") and we make that
        // assumption.
        this.on_some_change(["preserve_domain"], this.update_domains, this);
        this.update_data();
    },

    update_mark_data: function() {
        var x_data = this.get_typed_field("x"),
            y_data = this.get_typed_field("y"),
            scales = this.get("scales"),
            x_scale = scales.x,
            y_scale = scales.y,
            color_scale = scales.color;

        if (x_data.length === 0 || y_data.length === 0) {
            this.mark_data = [];
        } else {
            //FIXME:Temporary fix to avoid misleading NaN error due to X and Y
            //being of different lengths. In particular, if Y is of a smaller
            //length, throws an error on the JS side
            var min_len = Math.min(x_data.length, y_data.length);
            x_data = x_data.slice(0, min_len);
            var color = this.get_typed_field("color"),
                size = this.get_typed_field("size"),
                opacity = this.get_typed_field("opacity"),
                rotation = this.get_typed_field("rotation");

            if(color_scale) {
                if(!this.get("preserve_domain").color) {
                    color_scale.compute_and_set_domain(color, this.model_id + "_color");
                } else {
                    color_scale.del_domain([], this.model_id + "_color");
                }
            }

            this.mark_data = x_data.map(function(d, i) {
                return {
                    x: d,
                    y: y_data[i],
                    color: color[i],
                    size: size[i],
                    opacity: opacity[i],
                    rotation: rotation[i],
                    index: i
                };
            });
        }
    },

    update_data: function() {
        this.dirty = true;
        this.update_mark_data();
        this.update_unique_ids();
        this.update_domains();
        this.dirty = false;
        this.trigger("data_updated");
    },

    update_unique_ids: function() {},

    get_data_dict: function(data, index) {
        return data;
    },

    update_domains: function() {
        if (!this.mark_data) {
            return;
        }
        // color scale needs an issue in DateScaleModel to be fixed. It
        // should be moved here as soon as that is fixed.

       var scales = this.get("scales");
       for (var key in scales) {
            if(scales.hasOwnProperty(key) && key != "color") {
                var scale = scales[key];
                if(!this.get("preserve_domain")[key]) {
                    scale.compute_and_set_domain(this.mark_data.map(function(elem) {
                        return elem[key];
                    }), this.model_id + key);
                } else {
                    scale.del_domain([], this.model_id + key);
                }
            }
       }
    }
});

module.exports = {
    ScatterBaseModel: ScatterBaseModel
};
