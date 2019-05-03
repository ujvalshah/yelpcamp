main.css 

.image-thumb{
  width: 100%;
  height: 250px;
  background-size: cover;
  background-position: center center;
}

campgrounds.ejs

        <% campgrounds.forEach(function(campground){ %>
            <div class="col-md-3 col-sm-6">
                <div class="thumbnail">
                   <div class="image-thumb" style="background-image: url(<%= campground.image %>)"></div>
                   <div class="caption">
                       <h4><%= campground.name %></h4>
                   </div>
                </div>
            </div>
        <% }); %>
        
<!--router.delete("/:id", middleware.checkCampgroundOwnership, function (req, res, next){-->
<!--    Campground.findById(req.params.id, function(err,campground){-->
<!--            if(err) return next(err);-->
            
<!--            campground.remove();-->
<!--            req.flash("success","Campground Deleted");-->
<!--            res.redirect("/campgrounds");-->
<!--    });-->
<!--});-->


// noMatch Fuzzy Search
 <!--<div class="col-md-12">-->
    <!--    <%if(noMatch !== undefined){ %>-->
    <!--    <h3> <%= noMatch %> </h3>-->
    <!--    <% } %>-->
    <!--</div>-->
    
      <!--// var noMatch;-->
      <!--      // if(allCampgrounds.length<1){-->
      <!--      //     noMatch="Campgrounds not found. Please search again"-->
      <!--      // }-->
    
---------------------------------------
//Original Create Database Code
---------------------------------------
router.post("/", middleware.isLoggedIn, upload.single('image'), function(req, res) {
  // get data from form and add to campgrounds array
  var name = req.body.name;
  var image = req.body.image;
  var desc = req.body.description;
  var author = {
      id: req.user._id,
      username: req.user.username
  }
  geocoder.geocode(req.body.location, function (err, data) {
    if (err || !data.length) {
      console.log(err);
      req.flash('error', 'Invalid address');
      return res.redirect('back');
    }
    var lat = data[0].latitude;
    var lng = data[0].longitude;
    var location = data[0].formattedAddress;
    var newCampground = {name: name, image: image, description: desc, author:author, location: location, lat: lat, lng: lng};
    
    
    
    
    --------------------------
    //Update File
    //update route
// UPDATE CAMPGROUND ROUTE
--------------------------------------
router.put("/:id", middleware.checkCampgroundOwnership,function(req, res){
  geocoder.geocode(req.body.location, function (err, data) {
    if (err || !data.length) {
      req.flash('error', 'Invalid address');
      return res.redirect('back');
    }
    req.body.campground.lat = data[0].latitude;
    req.body.campground.lng = data[0].longitude;
    req.body.campground.location = data[0].formattedAddress;

    Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err, campground){
        if(err){
            req.flash("error", err.message);
            res.redirect("back");
        } else {
            req.flash("success","Successfully Updated!");
            res.redirect("/campgrounds/" + campground._id);
        }
    });
  });
});

    
    --------------------------
    // Delet Route
--------------------------------------

router.delete("/:id", middleware.checkCampgroundOwnership, function (req, res, next){
    Campground.findById(req.params.id, function(err, campground){
          if(err) return next(err);
        
          campground.remove();
          req.flash("success","Campground Deleted Successfully");
          res.redirect("/campgrounds");
    });
});