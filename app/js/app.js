/*
 * App()
 * ======
 */
+function ($) {
    'use strict';

    // 创建Plane对象
    var plane = new Plane($('#plane'), {
        position: {
            x: 100,
            y: 100
        },
        angle: 0
    });

    // 创建Designer对象
    var designer = new Designer({
        container: document.getElementById('designer'),
        media: 'vendors/google-blockly/media/',
        toolbox: document.getElementById('toolbox'),
        startBlocks: document.getElementById('startBlocks'),
        actor: plane
    });


    // 单步运行按钮
    var stepButton = document.getElementById('stepButton');
    stepButton.onclick = function () {
        designer.stepCode()
    };

    // 自动运行按钮
    var runButton = document.getElementById('runButton');
    runButton.onclick = function () {
        designer.runCode()
    };

}(jQuery);