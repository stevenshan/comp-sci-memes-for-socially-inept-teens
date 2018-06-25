# create index file for image directory
# first checks if index.json already exists and if so
# uses the directory specified in it and updates the indices
# by removing non-existant files
# otherwise default check if /images directory exists and creates
# new index file with blank values

import os
import json
from dateutil.parser import parse
import datetime

if __name__ == "__main__":

    # create default index dictionary
    index = {
        "directory": "images/", 
        "images": {}
    }

    # check if index.json already exists
    if not os.path.isfile("index.json"):
        print("Didn't find index.json file, using default index schema")
    else:
        print("index.json already exists, using it for index")
        index = json.load(open("index.json"))

    # make sure index file is properly formatted
    if ("directory" not in index or "images" not in index or
            not isinstance(index["images"], dict)):
        print("Index file is not properly formatted")
        exit()

    # make sure directory exists
    try:
        if not os.path.isdir(index["directory"]):
            raise ValueError("no directory")
    except:
        print("Directory does not exist")
        exit()

    # get directory listing of images
    listing = os.listdir(index["directory"])

    # remove images from index that don't exist in directory
    deleteQueue = []
    for image in index["images"]:
        if image not in listing:
            deleteQueue.append(image) 

    for image in deleteQueue:
        del index["images"][image]
        print("Removing " + image + " from index")

    # add image to directory
    for image in listing:
        if image not in index["images"]:
            index["images"][image] = {}

    # correct schema for images
    def get(json, key):
        try:
            return json[key]
        except:
            return "" 
    now = datetime.datetime.now().isoformat()
    ts = lambda x: parse(x).isoformat()
    for filename in index["images"]:
        image = index["images"][filename]
        image["timestamp"] = get(image, "timestamp")
        try:
            image["timestamp"] = ts(image["timestamp"])
        except:
            image["timestamp"] = None
        if image["timestamp"] == None or image["timestamp"] == "":
            image["timestamp"] = now
        image["title"] = get(image, "title")
        image["description"] = get(image, "description")

    file = open("index.json", "w")
    json.dump(index, file)
    file.close()

    print("Done")
