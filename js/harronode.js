import { app } from "../../scripts/app.js";
import { api } from "../../scripts/api.js";

let origProps = {};
let initialized = false;

const harroWidgetHandlers = {
    "Harronode": {
        'color_count': handleColorCount,
        'style_count': handleStyleCount,
        'accent_count': handleAccentCount,
        'content_count': handleContentCount
    },
    "PromptEditor": {
        'mode': handleMode
    },
};

function handleColorCount(node, widget) {
    updateColorWidgets(node, widget.value);
}

function handleStyleCount(node, widget) {
    updateStyleWidgets(node, widget.value);
}

function handleAccentCount(node, widget) {
    updateAccentWidgets(node, widget.value);
}

function handleContentCount(node, widget) {
    updateContentWidgets(node, widget.value);
}

function handleMode (node, widget) {
    const goButton = findWidgetByName(node, "Prompt looks good (GO)");
    const stopButton = findWidgetByName(node, "I need to adjust something (STOP)");
    const promptEditor = findWidgetByName(node, "promptEditor");
    if (widget.value == "Bypass"){
        goButton.disabled = 1==1;
        stopButton.disabled = 1==1;
        promptEditor.inputEl.disabled = 1==1;
    }
    else {
        goButton.disabled = 1==0;
        stopButton.disabled = 1==0;
        promptEditor.inputEl.disabled = 1==0;
    }
}

//-------function credit to efficiency nodes for comfyUI---------//

const findWidgetByName = (node, name) => {
    return node.widgets ? node.widgets.find((w) => w.name === name) : null;
};

const doesInputWithNameExist = (node, name) => {
    return node.inputs ? node.inputs.some((input) => input.name === name) : false;
};

const HIDDEN_TAG = "harrohide";

function toggleWidget(node, widget, show = false, suffix = "") {
    if (!widget || doesInputWithNameExist(node, widget.name)) return;

    // Store the original properties of the widget if not already stored
    if (!origProps[widget.name]) {
        origProps[widget.name] = { origType: widget.type, origComputeSize: widget.computeSize };
    }

    const origSize = node.size;

    // Set the widget type and computeSize based on the show flag
    widget.type = show ? origProps[widget.name].origType : HIDDEN_TAG + suffix;
    widget.computeSize = show ? origProps[widget.name].origComputeSize : () => [0, -4];

    // Recursively handle linked widgets if they exist
    widget.linkedWidgets?.forEach(w => toggleWidget(node, w, ":" + widget.name, show));

    // Calculate the new height for the node based on its computeSize method
    const newHeight = node.computeSize()[1];
    node.setSize([node.size[0], newHeight]);
}
//--------------------------END CREDIT---------------------------//

function updateColorWidgets(node, color_count){
    for (let i = 1; i <= 3; i++) {
        //find widget
        const color_picker = findWidgetByName(node, `color_${i}`)
        if(i <= color_count){
            //set visible and required
            toggleWidget(node, color_picker, true)
        }
        else {
            //hide and set not required
            toggleWidget(node, color_picker, false)
        }
    }
}

function updateStyleWidgets(node, color_count){
    for (let i = 1; i <= 3; i++) {
        //find widget
        const style_picker = findWidgetByName(node, `style_${i}`)
        if(i <= color_count){
            //set visible and required
            toggleWidget(node, style_picker, true)
        }
        else {
            //hide and set not required
            toggleWidget(node, style_picker, false)
        }
    }
}
function updateAccentWidgets(node, color_count){
    for (let i = 1; i <= 3; i++) {
        //find widget
        const accent_picker = findWidgetByName(node, `accent_${i}`)
        if(i <= color_count){
            //set visible and required
            toggleWidget(node, accent_picker, true)
        }
        else {
            //hide and set not required
            toggleWidget(node, accent_picker, false)
        }
    }
}
function updateContentWidgets(node, color_count){
    for (let i = 1; i <= 3; i++) {
        //find widget
        const content_picker = findWidgetByName(node, `content_${i}`)
        if(i <= color_count){
            //set visible and required
            toggleWidget(node, content_picker, true)
        }
        else {
            //hide and set not required
            toggleWidget(node, content_picker, false)
        }
    }
}

function startupLogic (node, widget) //change name
{
    // Retrieve the handler for the current node title and widget name
    const handler = harroWidgetHandlers[node.comfyClass]?.[widget.name];
    if (handler) {
        handler(node, widget);
    }
    prompt = findWidgetByName(node, 'prompt');

}

/*
Comfy uses 'clicked' to make the button flash; so just disable that.
This *doesn't* stop the callback, it's totally cosmetic!
*/
function enable_disabling(button) {
    Object.defineProperty(button, 'clicked', {
        get : function() { return this._clicked; },
        set : function(v) { this._clicked = (v && this.name!=''); }
    })
}

function cancelButtonPressed (){

}

function progressButtonPressed (){

}

app.registerExtension({
    name: "harronode.harronode",
    nodeCreated(node) {
        for (const w of node.widgets || []) {
            let widgetValue = w.value;

            // Store the original descriptor if it exists
            let originalDescriptor = Object.getOwnPropertyDescriptor(w, 'value');

            Object.defineProperty(w, 'value', {
                get() {
                    // If there's an original getter, use it. Otherwise, return widgetValue.
                    let valueToReturn = originalDescriptor && originalDescriptor.get
                        ? originalDescriptor.get.call(w)
                        : widgetValue;

                    return valueToReturn;
                },
                set(newVal) {
                    // If there's an original setter, use it. Otherwise, set widgetValue.
                    if (originalDescriptor && originalDescriptor.set) {
                        originalDescriptor.set.call(w, newVal);
                    } else {
                        widgetValue = newVal;
                    }
                    
                    startupLogic(node, w);
                }
            });
        }
        setTimeout(() => { initialized = true; }, 500);

        if(node.comfyClass == "Harronode"){
            node.widgets[0].inputEl.placeholder = "Populated Prompt (Will be generated automatically)";
            node.widgets[1].inputEl.placeholder = "Input Text to Display on Image";
            const prompt = node.widgets.find((w) => w.name == 'prompt');
            prompt.inputEl.disabled = 1 == 1;
        }
        if(node.comfyClass == "PromptEditor") {
            console.log (node.widgets);
            const mode = node.widgets.find((w) => w.name === "mode");
            node.cancel_button_widget = node.addWidget("button", "cancel_button", "", cancelButtonPressed);
            node.send_button_widget = node.addWidget("button", "progress_button", "", progressButtonPressed);
            node.send_button_widget.name = "Prompt looks good (GO)";
            node.cancel_button_widget.name = "I need to adjust something (STOP)";
            enable_disabling(node.cancel_button_widget);
            enable_disabling(node.send_button_widget);
            startupLogic(node, node.cancel_button_widget);
            startupLogic(node, node.send_button_widget);
        }
    }
});
