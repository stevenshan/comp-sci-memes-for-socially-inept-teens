// parameters, can change these
var imageLoadNum = 1; // number of images to load at a time
// distance from image to each side of block
var imagePadding = 20;

// global variables, don't change these
var imagesDir = "images/"
var images = [];
var index = 0;
var loading = false;
var numColumns = -1;

function getColumnHeight(column)
{
    var attr = column.imageHeight;
    if (attr == undefined)
    {
        return 0;
    }
    else
    {
        return parseInt(column.imageHeight);
    }
}

function addColumnHeight(column, value)
{
    column.imageHeight = getColumnHeight(column) + value;
}

// get column of shortest height
function getMinColumn()
{
    // find shortest column to add image to
    var minHeight = -1;
    var column = undefined;
    var columns = $("#photos .column")
    var i = columns.length - 1;
    while (i >= 0)
    {
        var curColumn = columns.get(i); 
        var colHeight = getColumnHeight(curColumn);

        if (colHeight <= minHeight || minHeight == -1)
        {
            minHeight = colHeight;
            column = $(curColumn);
        }

        i -= 1;
    }

    return {"column": column, "height": minHeight};
}

// adds image to page
// do not call this directly, call scrollEvent instead
function loadImages(count, callback = undefined)
{
    if (loading)
    {
        return false;
    }

    loading = true;
    var origIndex = index;

    // loop to add images to page
    var k = 0;
    var colWidth = $("#photos .column").width() - 5;
    var next = function(k) {
        // loop end condition
        if (k >= count || origIndex >= images.length)
        {
            loading = false;
            if (typeof callback === "function")
            {
                callback();
            }
            return;
        }

        // get next available image
        var image = images[origIndex];
        origIndex += 1;

        // get path to image
        var path = imagesDir + image["_filePath"];

        // find shortest column to add image to
        var column = getMinColumn()["column"];

        // generate html for adding image to page
        var id = "image" + origIndex;
        html = $(
            '<div class="block" id="' + id + '">' + 
                '<div class="imgWrapper">' + 
                    '<img src="' + path + '">' +
                '</div>' +
            '</div>');

        // add image to shortest column
        column.append(html);

        // get height of image just added
        var ratio = 1.0 * image["_imageSize"]["y"] / image["_imageSize"]["x"];
        // subtract imagePadding to get max width of image
        var newHeight = ratio * (colWidth - imagePadding * 2);

        addColumnHeight(column.get(0), newHeight + imagePadding * 2);

        next(k + 1);
    }

    // add images once they've been preloaded
    var queuedAllPreload = false;
    var preloadQueueSize = 0;
    function preloadDone()
    {
        preloadQueueSize -= 1;

        // update image properties
        var obj = images[this.index];
        obj["_imageSize"]["x"] = this.width;        
        obj["_imageSize"]["y"] = this.height;        

        // done preloading
        if (preloadQueueSize == 0 && queuedAllPreload)
        {
            // start loop
            next(0);
        }
    }

    // preload images
    for (var i = 0; i < count && index < images.length; i++)
    {
        // get next available image
        var image = images[index];
        index += 1;

        // get path to image
        var path = imagesDir + image["_filePath"];

        // preload individual image
        temp = new Image();
        temp.src = path;
        temp.index = index - 1;
        temp.onload = preloadDone;

        preloadQueueSize += 1;
    }

    queuedAllPreload = true;

}

// event to check scroll position to see if page is at bottom
// so more images need to be loaded
function scrollEvent(callback = undefined)
{
    // make sure there are more images to load
    if (index >= images.length)
    {
        $("#loadingMessage").css("display", "none");

        if (typeof callback === "function") 
            callback(false);
        return false;
    } 

    $("#loadingMessage").css("display", "block");

    // don't try to load more until finished loading previous images
    if (loading == true)
    {
        return false;
    }

    var position = window.innerHeight + window.scrollY;
    var docHeight = document.body.offsetHeight;

    // get minimum height of columns
    var temp = getMinColumn();
    var minHeight = temp["height"];
    var photosHeight = $("#photos").offset().top + minHeight;

    // check if scrolled to bottom of photos
    if (position >= photosHeight || position >= docHeight - 10)
    {
        var tempCallback = function() { 
            if (typeof callback === "function") 
            {
                callback(true) 
            }
            $(window).trigger("scroll");
        };
        loadImages(imageLoadNum, tempCallback);
        return true;
    }

    if (typeof callback === "function") 
    {
        callback(false);
    }
    return false;
}

// handler for window resize in order to change number of columns
function resizeEvent()
{
    // calculate how many columns there should be
    var windowWidth = $(window).width();
    var newNumColumns = 4;
    if (windowWidth < 1000) newNumColumns = 3;
    if (windowWidth < 800)  newNumColumns = 2;
    if (windowWidth < 400)  newNumColumns = 1;

    // quit if nothing needs to be changed
    if (numColumns == newNumColumns) return;

    // update number of columns
    numColumns = newNumColumns;
    var columnHTML = '<div class="column"></div>';
    $("#photos").html(columnHTML.repeat(newNumColumns));

    // reset image index
    index = 0;

    // reload images
    scrollEvent();
}

$(function(){
    // load index file to get image urls
    $.getJSON("index.json", function(json){
        imagesDir = json["directory"];
        tempImages = json["images"]; 

        // parse timestamps and add object to images variable
        for (var url in tempImages)
        {
            image = tempImages[url];
            image["_timestamp"] = Date.parse(image["timestamp"]);
            image["_imageSize"] = {"x": 100, "y": 100};
            image["_filePath"] = url;

            images.push(image);
        }

        // sort images by newest to oldest
        images.sort(function(a, b){
            return b["_timestamp"] - a["_timestamp"];
        });

        // trigger resize to create columns
        resizeEvent();

        // load images on page load until page is filled
        var scrollLoadCallback = function(loadedMore)
        {
            if (loadedMore)
            {
                scrollEvent(scrollLoadCallback);
            }
        }
        scrollEvent(scrollLoadCallback);

        // setup event triggers

        // trigger for scroll event
        $(window).scroll(scrollEvent);

        // trigger for scroll event
        $(window).resize(resizeEvent);
    });

});