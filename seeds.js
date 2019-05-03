var mongoose = require("mongoose");
var Campground = require("./models/campground");
var Comment = require("./models/comment");

var data = [
    {
    name: "Campground 1",
    image: "https://farm8.staticflickr.com/7457/9586944536_9c61259490.jpg",
    description: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum."
    },
    {
    name: "Campground 2",
    image: "https://farm2.staticflickr.com/1408/5128829651_506b72b316.jpg",
    description: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum."
    },
    {
    name: "Campground 3",
    image: "https://farm4.staticflickr.com/3189/3062178880_4edc3b60d5.jpg",
    description: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum."
    }
]

function seedDB(){
    Campground.remove({}, function(err){
        if(err){
            console.log(err)
        }
        console.log("Campgrounds removed");
        Comment.deleteMany({}, function (err){
            if(err) {
                console.log(err);
            } console.log("Comments removed");
        })
        //add a few campgrounds
        data.forEach(function(seed){
            Campground.create(seed, function(err, campground){
                if(err){
                    console.log(err);
                }  else {
                    console.log("Campgrounds Created!");
                    Comment.create({
                        text: "This is an amazing place!",
                        author: "Candice"
                    }, function(err, comment) {
                      if(err){
                          console.log(err);
                      } else {
                          campground.comments.push(comment);
                          campground.save();
                          console.log("Comment Created!")
                      }
                    });
                }
            })
        })
        
    });
}





module.exports = seedDB