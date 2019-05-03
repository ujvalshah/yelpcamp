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



//index route - show all 
router.get("/", function(req, res){
    if(req.query.search){
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
           Campground.find({$or: [
               {name: regex}, 
               {location: regex}, 
               {"author.username":regex}
               ]}, 
               function(err, allCampgrounds){
        if(err || !allCampgrounds.length){
            console.log(err);
            req.flash("error","Campground does not exist")
            res.redirect("/campgrounds");
        } else {
        res.render("campgrounds/index", {campgrounds:allCampgrounds, page: "campgrounds"});
        }
    });
    }
    else {
        // Get all campgrounds from DB
    Campground.find({}, function(err, allCampgrounds){
        if(err){
            console.log(err);
        } else {
               res.render("campgrounds/index", {campgrounds:allCampgrounds, page: "campgrounds"});
        }
    });
    };
});

//create route
//CREATE - add new campground to DB
router.post("/", middleware.isLoggedIn, upload.single('image'), function(req, res){
  // get data from form and add to campgrounds array
  var name = req.body.name;
  var image = req.body.image;
  var desc = req.body.description;
  var price = req.body.price;
  var author = {
      id: req.user._id,
      username: req.user.username
  };
  geocoder.geocode(req.body.location, function (err, data) {
    if (err || !data.length) {
      console.log(err);
      req.flash('error', 'Invalid address');
      return res.redirect('back');
    }
    var lat = data[0].latitude;
    var lng = data[0].longitude;
    var location = data[0].formattedAddress;
    
    cloudinary.v2.uploader.upload(req.file.path, function(err, result) {
        if(err){
        req.flash('error', err.message);
        return res.redirect('back');
      }
    var image = result.secure_url;
    var imageId= result.public_id;
     var newCampground = {name: name, image: image, imageId: imageId, price:price, description: desc, author:author, location: location, lat: lat, lng: lng};
    
    Campground.create(newCampground, function(err, newlyCreated) {
    if (err) {
      req.flash('error', err.message);
      return res.redirect('back');
    }
    res.redirect('/campgrounds/' + newlyCreated.id);
     });
    });
  });
});


 
//NEW - show form to create new campground
router.get("/new", middleware.isLoggedIn, function(req, res){
   res.render("campgrounds/new"); 
});

//show route
router.get("/:id", function(req, res){
    Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
        if(err || !foundCampground){
            req.flash("error", "Campground not found!");
            res.redirect("back");
        } else  {
            // console.log(foundCampground);
            res.render("campgrounds/show",{campground: foundCampground});        
        }
    });
});

//edit route
router.get("/:id/edit", middleware.checkCampgroundOwnership, function(req, res) {
    Campground.findById(req.params.id, function(err, foundCampground){
        if(err){
            res.redirect("/campgrounds");
        } else {
                res.render("campgrounds/edit", {campground: foundCampground}       
       )}
    });
});

//update route
router.put("/:id", middleware.checkCampgroundOwnership, upload.single("image"), function (req, res) {
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
            await geocoder.geocode(req.body.location, function (err, data) {
              if (err) {
                  req.flash('error', 'Error');
                  console.log(err)};
              req.body.campground.lat = data[0].latitude;
              req.body.campground.lng = data[0].longitude;
              req.body.location = data[0].formattedAddress;
            });
            campground.name = req.body.campground.name;
            campground.description = req.body.campground.description;
            campground.price = req.body.campground.price;
            campground.location = req.body.location;
            campground.lat = req.body.campground.lat;
            campground.lng = req.body.campground.lng;
            campground.save();
            req.flash("success","Successfully Updated!");
            res.redirect("/campgrounds/" + campground._id);
        }
    });
});


// // UPDATE CAMPGROUND ROUTE
// router.put("/:id", middleware.checkCampgroundOwnership, upload.single("image"), function (req, res) {
//     geocoder.geocode(req.body.location, function (err, data) {
//         if (err) {
//             req.flash('error', 'Error');
//             console.log(err)};
//         var lat = data[0].latitude;
//         var lng = data[0].longitude;
//         var location = data[0].formattedAddress;
//         if(req.file){
//         cloudinary.uploader.upload(req.file.path, function (result){
//             if (req.file.path) {
//                 // add cloudinary url for the image to the campground object under image property
//                 req.body.campground.image = result.secure_url;
//                 req.body.campground.imageId = result.public_id;
//             }
//             var newData = { name: req.body.campground.name, image: req.body.campground.image, imageId: req.body.campground.imageId, description: req.body.campground.description, price: req.body.campground.price, location: location, lat: lat, lng: lng };
//             //Updated Data Object
//             Campground.findByIdAndUpdate(req.params.id, { $set: newData }, function (err, campground) {
//                 if (err) {
//                     //Flash Message
//                     req.flash("error", err.message);
//                     //Redirects Back
//                     res.redirect("back");
//                 }
//                 else {
//                     //Flash Message
//                     req.flash("success", "Successfully Updated!");
//                     //Redirects To Edited Campground
//                     res.redirect("/campgrounds/" + campground._id);
//                 }
//             }); //End Campground/findBoyIdAndUpdate
//         }); //Ends Cloudinary Image Upload
//         } else {
//              var newData = { name: req.body.campground.name, description: req.body.campground.description, price: req.body.campground.price, location: location, lat: lat, lng: lng };
//             //Updated Data Object
//             Campground.findByIdAndUpdate(req.params.id, { $set: newData }, function (err, campground) {
//                 if (err) {
//                     //Flash Message
//                     req.flash("error", err.message);
//                     //Redirects Back
//                     res.redirect("back");
//                 }
//                 else {
//                     //Flash Message
//                     req.flash("success", "Successfully Updated!");
//                     //Redirects To Edited Campground
//                     res.redirect("/campgrounds/" + campground._id);
//                 }
//             }); //End Campground/findBoyIdAndUpdate
//         }
//     }); //Ends Geocoder()
// }); //Ends Put Router

//delete route


router.delete("/:id", middleware.checkCampgroundOwnership, function (req, res, next){
    Campground.findById(req.params.id, function(err, campground){
          if(err) return next(err);
        
          campground.remove();
          req.flash("success","Campground Deleted Successfully");
          res.redirect("/campgrounds");
    });
});

// router.delete("/:id", middleware.checkCampgroundOwnership, function (req, res, next){
//     Campground.findById(req.params.id, function(err,campground){
//         Comment.remove({
//             "_id": {
//                 $in: campground.comments
//             }
//         }, function(err){
//             if(err) return next(err);
//             campground.remove();
//             req.flash("success","Campground Deleted")
//             res.redirect("/campgrounds");
//         });
//     });
// });

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}


module.exports = router;