/*
 * Designer()
 * ======
 */
+function ($) {
    'use strict';

    var Default = {};

    var ClassName = {
        designer: 'designer',
    };

    var workspace = null;
    var latestCode = '';
    var highlightPause = false;
    var interpreter = null;
    var actor = null;                   // 运动物体
    var runner = null;


    // Designer Class Definition
    // =====================
    var Designer = function (options) {
        this.options = $.extend({}, Default, options || {});
        this.element = options.container;
        this.$element = $(this.element);

        this.$element.addClass(ClassName.designer);

        this._init();
    };

    // Block Definition
    function blockDefinition() {
        Blockly.Blocks['start'] = {
            init: function () {
                this.jsonInit({
                    "message0": "从这里开始",
                    "nextStatement": null,
                    "colour": 30,
                    "tooltip": "",
                    "helpUrl": ""
                });
            }
        };
        Blockly.Blocks['move_forward'] = {
            init: function () {
                this.jsonInit({
                    "message0": "向前移动 %1 步",
                    "args0": [
                        {
                            "type": "field_number",
                            "name": "STEP",
                            "value": 0,
                            "min": 1,
                            "max": 10
                        }
                    ],
                    "previousStatement": null,
                    "nextStatement": null,
                    "colour": 150,
                    "tooltip": "",
                    "helpUrl": ""
                });
            }
        };
        Blockly.Blocks['rotate'] = {
            init: function () {
                this.jsonInit({
                    "message0": "向 %1 旋转 %2 度",
                    "args0": [
                        {
                            "type": "field_dropdown",
                            "name": "DIR",
                            "options": [
                                [
                                    "右",
                                    "1"
                                ],
                                [
                                    "左",
                                    "-1"
                                ]
                            ]
                        },
                        {
                            "type": "field_number",
                            "name": "ANGLE",
                            "value": 0,
                            "min": 0,
                            "max": 360
                        }
                    ],
                    "previousStatement": null,
                    "nextStatement": null,
                    "colour": 345,
                    "tooltip": "",
                    "helpUrl": ""
                });
            }
        };
    }

    // Generator stub
    function generatorStub() {
        Blockly.JavaScript['move_forward'] = function (block) {
            var step = block.getFieldValue('STEP');
            var code = 'moveForward(' + step + ');\n';
            return code;
        };
        Blockly.JavaScript['rotate'] = function (block) {
            var dir = block.getFieldValue('DIR');
            var angle = block.getFieldValue('ANGLE');

            angle = (parseInt(dir) || 1) * (parseInt(angle) || 0);

            var code = 'rotate(' + angle + ');\n';
            return code;
        };
    }

    function initApi(interpreter, scope) {
        // Add an API function for the moveForward() block, generated for "move_forward" blocks.
        // interpreter.setProperty(scope, 'moveForward',
        //     interpreter.createNativeFunction(function (step) {
        //         console.log('moveForward:', step);
        //         actor.moveForward(step || 0);
        //     }));

        interpreter.setProperty(scope, 'moveForward',
            interpreter.createAsyncFunction(
                function(step, callback) {
                    console.log('moveForward:', step);
                    actor.moveForward(step || 0, callback);
                }));



        // Add an API function for the rotate() block, generated for "rotate" blocks.
        // interpreter.setProperty(scope, 'rotate',
        //     interpreter.createNativeFunction(function (dir, angle) {
        //         console.log('rotate:', angle);
        //         actor.rotate((dir || 1) * (angle || 0));
        //     }));

        interpreter.setProperty(scope, 'rotate',
            interpreter.createAsyncFunction(
                function(angle, callback) {
                    console.log('rotate:', angle);
                    actor.rotate(angle, callback);
                }));

        // Add an API function for highlighting blocks.
        interpreter.setProperty(scope, 'highlightBlock',
            interpreter.createNativeFunction(function (id) {
                id = id ? id.toString() : '';
                console.log('highlightBlock:', id);
                return interpreter.createPrimitive(highlightBlock(id));
            }));
    }

    function highlightBlock(id) {
        workspace.highlightBlock(id);
        highlightPause = true;
    }

    function generateCodeAndLoadIntoInterpreter() {
        // Generate JavaScript code and parse it.
        Blockly.JavaScript.STATEMENT_PREFIX = 'highlightBlock(%1);\n';
        Blockly.JavaScript.addReservedWords('highlightBlock');
        latestCode = Blockly.JavaScript.workspaceToCode(workspace);
        resetStepUi(true);
    }

    function resetStepUi(clearOutput) {
        workspace.highlightBlock(null);
        highlightPause = false;

        if (clearOutput) {
            console.log('Program output:\n=================');
        }
    }

    function resetInterpreter() {
        interpreter = null;
        if (runner) {
            clearTimeout(runner);
            runner = null;
        }
    }

    /**
     * 初始化
     * @private
     */
    Designer.prototype._init = function () {
        var that = this;
        var options = this.options;

        actor = options.actor;

        blockDefinition();
        generatorStub();

        workspace = Blockly.inject(options.container.id, {
            media: options.media,
            toolbox: options.toolbox,
            trashcan: true
        });

        if (options.startBlocks) {
            Blockly.Xml.domToWorkspace(options.startBlocks, workspace);
        }


        // Load the interpreter now, and upon future changes.
        generateCodeAndLoadIntoInterpreter();
        workspace.addChangeListener(function (event) {
            if (!(event instanceof Blockly.Events.Ui)) {
                // Something changed. Parser needs to be reloaded.
                generateCodeAndLoadIntoInterpreter();
            }
        });

    };

    /**
     * 单步执行
     */
    Designer.prototype.stepCode = function () {
        var that = this;
        if (!interpreter) {
            // First statement of this code.
            // Clear the program output.

            resetStepUi(true);
            interpreter = new Interpreter(latestCode, initApi);

            // And then show generated code in an alert.
            // In a timeout to allow the outputArea.value to reset first.
            setTimeout(function () {
                highlightPause = true;
                that.stepCode();
            }, 1);
            return;
        }
        highlightPause = false;
        do {
            try {
                var hasMoreCode = interpreter.step();
            } finally {
                if (!hasMoreCode) {
                    // Program complete, no more code to execute.
                    console.log('<< Program complete >>');
                    interpreter = null;
                    return;
                }
            }
        } while (hasMoreCode && !highlightPause);
    };

    /**
     * 自动执行
     */
    Designer.prototype.runCode = function () {
        if (!interpreter) {
            // First statement of this code.
            // Clear the program output.
            resetStepUi(true);

            // And then show generated code in an alert.
            // In a timeout to allow the outputArea.value to reset first.
            setTimeout(function () {

                // Begin execution
                highlightPause = false;

                console.log(latestCode);

                interpreter = new Interpreter(latestCode, initApi);
                runner = function () {
                    if (interpreter) {
                        var hasMore = interpreter.run();
                        if (hasMore) {
                            // Execution is currently blocked by some async call.
                            // Try again later.
                            setTimeout(runner, 10);
                        } else {
                            // Program is complete.
                            console.log('<< Program complete >>');
                            resetInterpreter();
                            resetStepUi(false);
                        }
                    }
                };
                runner();
            }, 1);
            return;
        }
    }


    window.Designer = Designer;

}(jQuery);