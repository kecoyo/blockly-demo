// Block Definition
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
            "message0": "旋转 %1 度",
            "args0": [
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

// Generator stub
Blockly.JavaScript['move_forward'] = function (block) {
    var step = block.getFieldValue('STEP');
    console.log(block);
    var code = 'move_forward("move_forward: ' + step + '");\n';
    return code;
};
Blockly.JavaScript['rotate'] = function (block) {
    var angle = block.getFieldValue('ANGLE');
    var code = 'alert("rotate: ' + angle + '");\n';
    return code;
};

var demoWorkspace = Blockly.inject('blocklyDiv', {
    media: 'vendors/google-blockly/media/',
    toolbox: document.getElementById('toolbox')
});

Blockly.Xml.domToWorkspace(document.getElementById('startBlocks'),
    demoWorkspace);


var stepButton = document.getElementById('stepButton');

stepButton.onclick = function () {
    stepCode()
};

var code = Blockly.JavaScript.workspaceToCode(demoWorkspace);

console.log(code);

var myInterpreter = null;

function initApi(interpreter, scope) {
    // Add an API function for the alert() block, generated for "text_print" blocks.
    interpreter.setProperty(scope, 'alert',
        interpreter.createNativeFunction(function (text) {
            text = text ? text.toString() : '';
            console.log(text);
        }));

    // Add an API function for the prompt() block.
    var wrapper = function (text) {
        text = text ? text.toString() : '';
        return interpreter.createPrimitive(prompt(text));
    };
    interpreter.setProperty(scope, 'prompt',
        interpreter.createNativeFunction(wrapper));

    // Add an API function for highlighting blocks.
    var wrapper = function (id) {
        id = id ? id.toString() : '';
        return interpreter.createPrimitive(highlightBlock(id));
    };
    interpreter.setProperty(scope, 'highlightBlock',
        interpreter.createNativeFunction(wrapper));
}

var highlightPause = false;
var latestCode = '';

function highlightBlock(id) {
    demoWorkspace.highlightBlock(id);
    highlightPause = true;
}

function resetStepUi(clearOutput) {
    demoWorkspace.highlightBlock(null);
    highlightPause = false;

    if (clearOutput) {
        console.log( 'Program output:\n=================');
    }
}

function generateCodeAndLoadIntoInterpreter() {
    // Generate JavaScript code and parse it.
    Blockly.JavaScript.STATEMENT_PREFIX = 'highlightBlock(%1);\n';
    Blockly.JavaScript.addReservedWords('highlightBlock');
    latestCode = Blockly.JavaScript.workspaceToCode(demoWorkspace);
    resetStepUi(true);
}


function stepCode() {
    if (!myInterpreter) {
        // First statement of this code.
        // Clear the program output.
        resetStepUi(true);
        myInterpreter = new Interpreter(latestCode, initApi);

        // And then show generated code in an alert.
        // In a timeout to allow the outputArea.value to reset first.
        setTimeout(function () {
            alert('Ready to execute the following code\n' +
                '===================================\n' + latestCode);
            highlightPause = true;
            stepCode();
        }, 1);
        return;
    }
    highlightPause = false;
    do {
        try {
            var hasMoreCode = myInterpreter.step();
        } finally {
            if (!hasMoreCode) {
                // Program complete, no more code to execute.
                console.log('<< Program complete >>');

                myInterpreter = null;
                resetStepUi(false);

                // Cool down, to discourage accidentally restarting the program.
                stepButton.disabled = 'disabled';
                setTimeout(function () {
                    stepButton.disabled = '';
                }, 2000);

                return;
            }
        }
        // Keep executing until a highlight statement is reached,
        // or the code completes or errors.
    } while (hasMoreCode && !highlightPause);
}

// Load the interpreter now, and upon future changes.
generateCodeAndLoadIntoInterpreter();
demoWorkspace.addChangeListener(function(event) {
    if (!(event instanceof Blockly.Events.Ui)) {
        // Something changed. Parser needs to be reloaded.
        generateCodeAndLoadIntoInterpreter();
    }
});

