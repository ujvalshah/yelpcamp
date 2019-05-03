var express      = require("express");
var router       = express.Router();
var Campground   = require("../models/campground");
var Comment      = require("../models/comment");
var middleware      = require("../middleware");
var NodeGeocoder = require('node-geocoder');
var multer = require('multer');

var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter});

var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: 'qwertyas', 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

var options = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null
};
 
var geocoder = NodeGeocoder(options);


// UPDATE CAMPGROUND ROUTE
router.put("/:id", middleware.checkCampgroundOwnership, upload.single('image'), function(req, res){
    
    geocoder.geocode(req.body.location, function (err, data) {
    if (err || !data.length) {
     req.flash('error', 'Invalid address');
     return res.redirect('back');
    }
    req.body.campground.lat = data[0].latitude;
    req.body.campground.lng = data[0].longitude;
    req.body.campground.location = data[0].formattedAddress;

    cloudinary.uploader.upload(req.file.path, function (result) {
            if (req.file.path) {
                // add cloudinary url for the image to the campground object under image property
                req.body.campground.image = result.secure_url;
                req.body.campground.imageId = result.public_id;
                
            }
    var newData = { name: req.body.campground.name, image: req.body.campground.image, imageId:req.body.campground.imageId, description: req.body.campground.description, price: req.body.campground.price, location: req.body.campground.location, lat: req.body.campground.lat, lng: req.body.campground.lng };
     
   //Updated Data Object
            Campground.findByIdAndUpdate(req.params.id, { $set: newData }, function (err, campground) {
                if (err) {
                    //Flash Message
                    req.flash("error", err.message);

                    //Redirects Back
                    res.redirect("back");
                }
                else {
                    //Flash Message
                    req.flash("success", "Successfully Updated!");

                    //Redirects To Edited Campground
                    res.redirect("/campgrounds/" + campground._id);
                }
            }); //End Campground/findBoyIdAndUpdate
        });
    });
});



router.put("/:id", middleware.checkCampgroundOwnership,function(req, res){
  geocoder.geocode(req.body.location, function (err, data) {
    if (err || !data.length) {
      req.flash('error', 'Invalid address');
      return res.redirect('back');
    }
    req.body.campground.lat = data[0].latitude;
    req.body.campground.lng = data[0].longitude;
    req.body.campground.location = data[0].formattedAddress;
    Campground.findById(req.params.id, async function(err, campground){
        if(err){
            req.flash("error", err.message);
            res.redirect("back");
        } else {
            if (req.file) {
              try {
                  await cloudinary.v2.uploader.destroy(campground.imageId);
                  var result = await cloudinary.v2.uploader.upload(req.file.path);
                  campground.imageId = result.public_id;
                  campground.image = result.secure_url;
              } catch(err) {
                  req.flash("error", err.message);
                  return res.redirect("back");
              }
            }
            campground.name = req.body.campground.name;
            campground.description = req.body.campground.description;
            campground.price = req.body.campground.price;
            campground.location = req.body.campground.location;
            campground.lat = req.body.campground.lat;
            campground.lng = req.body.campground.lng;
            campground.save();
            req.flash("success","Successfully Updated!");
            res.redirect("/campgrounds/" + campground._id);
        }
    });
  });
});

//----------------------------------------------------------------------------------------------

// UPDATE CAMPGROUND ROUTE
router.put("/:id", middleware.checkCampgroundOwnership, upload.single("image"), function (req, res) {
    geocoder.geocode(req.body.location, function (err, data) {
        if (err) {
            req.flash('error', 'Error');
            console.log(err)};
        var lat = data[0].latitude;
        var lng = data[0].longitude;
        var location = data[0].formattedAddress;
        if(req.file){
        cloudinary.uploader.upload(req.file.path, function (result){
            if (req.file.path) {
                // add cloudinary url for the image to the campground object under image property
                req.body.campground.image = result.secure_url;
                req.body.campground.imageId = result.public_id;
            }
            var newData = { name: req.body.campground.name, image: req.body.campground.image, imageId: req.body.campground.imageId, description: req.body.campground.description, price: req.body.campground.price, location: location, lat: lat, lng: lng };
            //Updated Data Object
            Campground.findByIdAndUpdate(req.params.id, { $set: newData }, function (err, campground) {
                if (err) {
                    //Flash Message
                    req.flash("error", err.message);
                    //Redirects Back
                    res.redirect("back");
                }
                else {
                    //Flash Message
                    req.flash("success", "Successfully Updated!");
                    //Redirects To Edited Campground
                    res.redirect("/campgrounds/" + campground._id);
                }
            }); //End Campground/findBoyIdAndUpdate
        }); //Ends Cloudinary Image Upload
        } else {
             var newData = { name: req.body.campground.name, description: req.body.campground.description, price: req.body.campground.price, location: location, lat: lat, lng: lng };
            //Updated Data Object
            Campground.findByIdAndUpdate(req.params.id, { $set: newData }, function (err, campground) {
                if (err) {
                    //Flash Message
                    req.flash("error", err.message);
                    //Redirects Back
                    res.redirect("back");
                }
                else {
                    //Flash Message
                    req.flash("success", "Successfully Updated!");
                    //Redirects To Edited Campground
                    res.redirect("/campgrounds/" + campground._id);
                }
            }); //End Campground/findBoyIdAndUpdate
        }
    }); //Ends Geocoder()
}); //Ends Put Router
