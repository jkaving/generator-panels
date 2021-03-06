/*
 * Copyright (c) 2014 Adobe Systems Incorporated. All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 *
 */

//
// Generator Configuration panel, for setting the generator-assets options.
//
// John Peterson - May 2014
//

// Configuration code (taken from Generator)
var config = require("./js/config");

// Hard-coded defaults.  These should match the defaults
// from the Generator code.

// This table defines all of the checkbox (true/false) controls
// Table is: default | HTML tag | config ID | English text label
// Note the CSS IDs of the checkbox elements match the
// keys used by the generator-assets configuration file.
var checkboxes = [
    [true,  "svg",            "svg-enabled",                        "SVG Enabled"],
    [true,  "svgomg",         "svgomg-enabled",                     "SVG OMG Enabled"],
    [false, "copycss",        "css-enabled",                        "Enable Copy CSS"],
    [false, "smartscale",     "use-smart-scaling",                  "Use Smart Scaling"],
    [false, "ancmasks",       "include-ancestor-masks",             "Included Ancestor Masks"],
    [false, "dither",         "allow-dither",                       "Allow Dither"],
    [false, "usesmartobject", "use-psd-smart-object-pixel-scaling", "Smart Object Pixel Scaling"],
    [true,  "pngquant",       "use-pngquant",                       "Use pngquant for PNG-8"],
    [false, "convcolorspace", "convert-color-space",                "Color convert pixels"],
    [false, "useflite",       "use-flite",                          "Use FLITE transcoder"],
    [false, "embediccprofile","embed-icc-profile",                  "Output ICC profile from PSD"], // use-flite
    [true,  "cliptodocbounds","clip-all-images-to-document-bounds", "Exports clipped to doc bounds"],
    [true,  "cliptoabbounds", "clip-all-images-to-artboard-bounds", "Exports clipped to artboard"],
    [true,  "maskaddspad",    "mask-adds-padding",                  "Masks add padding to export"],
    [false, "expandmaxdim",   "expand-max-dimensions",              "Allow larger max dimensions"],
    // WebP must be last - it's only visible on the Mac
    [false, "webp",           "webp-enabled",                       "WebP Enabled"]];

var defaultPSInterpolation = "bicubicAutomatic";
var iccProfileList = [];

// Manage control interdependencies here.
function enableItems()
{
    // Some controls require FLITE transcoder
    var usingFlite = $("#use-flite")[0].checked;
    $("#embed-icc-profile").attr( "disabled", !usingFlite );
    $("#use-jpg-encoding").attr( "disabled", !usingFlite );

    // Disable convert-color-space if an ICC profile is selected
    var profileSelected = $("#icc-profile")[0].value !== "icc-unselected";
    $("#convert-color-space").attr("disabled", profileSelected);
    
}

// Disable/enable the Save & Revert buttons (class saverev)
function saveDisable(flag)
{
    $(".saverev").prop( "disabled", flag );
}

// Set controls to their default values
function setDefaultValues()
{
    for (var i in checkboxes)
        $("#" + checkboxes[i][2]).prop('checked', checkboxes[i][0]);
    $("#interpolation-type").val( defaultPSInterpolation );
    $("#icc-profile").val( "icc-unselected" );
    $("#use-jpg-encoding").val( "none" );
}

// Load the configuration and set the checkboxes.
function loadConfig()
{
    // Start w/ the hard-coded defaults, they'll be
    // overwritten with values from the config file.
    setDefaultValues();

    var currentConfig = config.getConfig();
    if (currentConfig && currentConfig["generator-assets"]) {
        var optionList = Object.keys(currentConfig["generator-assets"]);
        // Set the checkbox values
        optionList.forEach( function( opt ) {
            if ($("#" + opt).attr("class") === "configchk")
                $("#" + opt).prop('checked', currentConfig["generator-assets"][opt] );
            if ($("#" + opt).attr("class") === "ccmenu")
                $("#" + opt).val( currentConfig["generator-assets"][opt] );
        });
    }

    // Checkboxes now match config file on disk, so save/revert buttons disable.
    saveDisable( true );
    enableItems();
    return currentConfig;
}

// Since the checkboxes all use the same boilerplate HTML,
// generate them on the fly.
function generateCheckboxes()
{
    function addBox( tag, id, message )
    {
        var boxContent = ['<div class="checkboxwrap">',
                          '  <input class="configchk" type="checkbox" name="#ID#" id="#ID#" />',
                          '  <label id="#TAG#label" for="#ID#">',
                          '  <span data-locale="#TAG#-checkbox" id="#TAG#span">#MESSAGE#</span>',
                          '</label></div>'].join("\n");

        // Clever hack for search/replace - http://stackoverflow.com/a/1145525/105767
        boxContent = boxContent.split("#TAG#").join(tag);
        boxContent = boxContent.split("#ID#").join(id);
        boxContent = boxContent.split("#MESSAGE#").join(message);
        $("#checkboxes").append( boxContent );
    }
    
    // Lookup table of localized strings.  Need to look up translation
    // on the fly, since we're generating the panel HTML on the fly.
    var localeResources = csInterface.initResourceBundle();

    for (var i in checkboxes) {
        var box = checkboxes[i];
        var localizedStr = localeResources[box[1] + "-checkbox"];
        addBox( box[1], box[2], localizedStr ? localizedStr : box[3] );
    }
}

function generateProfileMenu()
{
    // Rip out punctionuation to make an HTML tag
    function tagify(s) { return s.replace(/[\s)(.-]+/g,""); };
    for (var i in iccProfileList) {
        $("#icc-profile").append("<option value='" + iccProfileList[i] +"'>"+iccProfileList[i] + "</option>");
    }
}

// Called when the panel loads
function initialize()
{
    csInterface.initResourceBundle();
    initColors();

    // Query the default interpolation now to avoid
    // a race condition when setting the control.
    csInterface.evalScript("DefaultInterpolationMethod();",
                            function( method ) { defaultPSInterpolation = method; } );
    csInterface.evalScript("GetColorProfileList();",
                           function(iccList) { iccProfileList = iccList.split(",");
                                               generateProfileMenu(); } );

    generateCheckboxes();
    generateProfileMenu();
    loadConfig();

    if (process.platform !== "darwin")
        $("#webplabel").toggle(false);  // This option is Mac-only

    // For some goofy reason, checkboxes are spaced out more on
    // Windows then they are on Mac.  This hacks around that.
    if (navigator.platform === "Win32")
        $(".checkboxwrap").css("margin-bottom", "-2px");
}

// Initialize must be called -before- the change() callback is
// defined, so the controls exist.
initialize();

// Control state no longer matches file on disk, so enable save & revert
$(".configchk").change( function() {
    saveDisable( false );
    enableItems();
});

$(".ccmenu").change( function() {
    saveDisable( false );
    enableItems();
});

$("#savebutton").click( function() {
    // Collect checkbox options
    var genOpts = { "generator-assets": {} };
    $(".configchk").each(function (i, checkbox) {
        genOpts["generator-assets"][checkbox.id] = checkbox.checked;
    });
    $(".ccmenu").each(function(i, menu) {
        genOpts["generator-assets"][menu.id] = menu.value;
    });

    if ($("#icc-profile")[0].value === "icc-unselected")
        delete genOpts['generator-assets']['icc-profile'];
        
    if ($("#use-jpg-encoding")[0].value === "none")
        delete genOpts['generator-assets']['use-jpg-encoding'];

    // Save results and disable save/revert
    config.putConfig(genOpts);
    saveDisable( true );

    // Restart generator
    csInterface.evalScript( "IsGeneratorRunning();", function(result) {
        if (result === "true") {
            $("#restarting").toggle(true);
            csInterface.evalScript( "EnableGenerator( false ); $.sleep(2000); EnableGenerator( true );",
                                    function(result) {
                                        $("#restarting").toggle(false);
                                    });
        }
    });
});

$("#revertbutton").click( function() {
    loadConfig();
    saveDisable( true );
});

$("#defaultbutton").click( function() {
    setDefaultValues();
    saveDisable( false );
});

$(".infolink").click( function() {
    csInterface.openURLInDefaultBrowser("https://github.com/adobe-photoshop/generator-assets/wiki/Configuration-Options");
} );
