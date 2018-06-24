// parameters, can change these
var imageLoadNum = 20; // number of images to load at a time

// global variables, no need to manually change
var imagesDir = "images/"
var images = [];
var index = 0;

function loadImages(count)
{
    var allImages = "";
    for (var i = 0; i < count && index < images.length; i++)
    {
        // get next available image
        image = images[index];
        index += 1;

        // get path to image
        path = imagesDir + image["filePath"];

        allImages += 
            '<div class="block">' + 
                '<div class="imgWrapper">' + 
                    '<img src="' + path + '">' +
                '</div>' +
            '</div>';
    }

    $('#photos').append(allImages);
}

// event to check scroll position to see if page is at bottom
// so more images need to be loaded
function scrollEvent()
{
    // make sure there are more images to load
    if (index >= images.length) return;
    
    // current scroll position in window
    var scrollPosition = $(window).scrollTop(); 

    // total height of entire document
    var docHeight = $(document).height();
    var windowHeight = $(window).height();

    // check if scrolled to page bottom
    if (scrollPosition + windowHeight + 50 >= docHeight)
    {
        loadImages(imageLoadNum);
    }
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
            image["timestamp"] = Date.parse(image["timestamp"]);
            image["filePath"] = url;

            images.push(image);
        }

        // sort images by newest to oldest
        images.sort(function(a, b){
            return b["timestamp"] - a["timestamp"];
        });

        // load the first 10 pictures
        loadImages(imageLoadNum);

        // trigger for scroll event
        $(window).scroll(scrollEvent);
        // manually trigger scroll at beginning to see if page is filled
        scrollEvent();

    });

});