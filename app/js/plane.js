/*
 * Plane()
 * ======
 */
+function ($) {
    'use strict';

    var Default = {
        stepDistance: 60           // 每步的距离
    };

    var ClassName = {
        plane: 'plane',
    };

    // Plane Class Definition
    // =====================
    var Plane = function (element, options) {
        this.element = element;
        this.options = $.extend({}, Default, options || {});

        this.$element = $(this.element);

        this.$element.addClass(ClassName.plane);

        this._init();
    };

    // 角度修正
    Plane.prototype._init = function () {
        var that = this;
        var options = this.options;

        this.$element.css({
            'top': options.position.y,
            'left': options.position.x,
            'transform': 'rotate(' + options.angle + 'deg)'
        });
    };

    // 物体旋转（加动画）
    Plane.prototype.rotate = function (angle, callback) {
        var that = this;
        var options = this.options;
        var fromAngle = options.angle;
        var toAngle = fromAngle + angle;

        this.$element.rotate({
            angle: fromAngle,
            animateTo: toAngle,
            callback: callback
        });

        options.angle = toAngle;
    };

    // 移动到指定位置
    Plane.prototype.moveTo = function (position, callback) {
        var that = this;
        var options = this.options;

        this.$element.animate({
            top: position.y,
            left: position.x,
        }, 1000, callback);

        options.position = position;
    };

    // 向前移动
    Plane.prototype.moveForward = function (step, callback) {
        var that = this;
        var options = this.options;
        var x1 = options.position.x,
            y1 = options.position.y,
            r = Math.PI / 180 * options.angle,
            d = options.stepDistance * step,
            x2 = parseInt(x1 + d * Math.cos(r)),
            y2 = parseInt(y1 + d * Math.sin(r));

        this.moveTo({
            x: x2,
            y: y2
        }, callback)
    };

    window.Plane = Plane;

}(jQuery);