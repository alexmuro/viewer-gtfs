/**
 * Each section of the site has its own module. It probably also has
 * submodules, though this boilerplate is too simple to demonstrate it. Within
 * `src/app/home`, however, could exist several additional folders representing
 * additional modules that would then be listed as dependencies of this one.
 * For example, a `note` section could have the submodules `note.create`,
 * `note.delete`, `note.edit`, etc.
 *
 * Regardless, so long as dependencies are managed correctly, the build process
 * will automatically take take of the rest.
 *
 * The dependencies block here is also where component dependencies should be
 * specified, as shown below.
 */
angular.module( 'transitAnalyst.home', [
  'ui.state',
  'leaflet-directive',
  'ui.bootstrap'
])

/**
 * Each section or module of the site can also have its own routes. AngularJS
 * will handle ensuring they are all available at run-time, but splitting it
 * this way makes each module more "self-contained".
 */
.config(function config( $stateProvider ) {
  $stateProvider.state( 'home', {
    url: '/',
    views: {
      "main": {
        controller: 'HomeCtrl',
        templateUrl: 'home/home.tpl.html'
      }
    },
    data:{ pageTitle: 'GTFS Analyst' }
  });
})

/**
 * And of course we define a controller for our route.
 */
.controller( 'HomeCtrl', function HomeController( $scope, $http, $log ) {
    $scope.current_agency = -1;
    angular.extend($scope, {
                leafletMap: null
    });

    $scope.agencies = {};
    $scope.loaded = false;
    $http({url:'http://api.availabs.org/gtfs/agency',method:"GET"}).success(function(data){
        $scope.agencies= data;
    });
    $scope.routes =[];
    $scope.stops = [];
    $scope.loaded_agency = {};
  

    
    $scope.loadAgency = function(agency_id){
        
      $http({url:'http://api.availabs.org/gtfs/agency/'+agency_id+'/routes/',method:"GET"}).success(function(data){
        var routesData = data;
        $http({url:'http://api.availabs.org/gtfs/agency/'+agency_id+'/stops/',method:"GET"}).success(function(data){                
          
          d3.select("svg").remove(); 
          //clear previous 

          var stopsData = data;
          var stops = topojson.feature(stopsData, stopsData.objects.stops);
          var routes = topojson.feature(routesData, routesData.objects.routes);
          var svg = d3.select($scope.leafletMap.getPanes().overlayPane).append("svg");
          var g = svg.append("g").attr("class", "leaflet-zoom-hide routes");
          var stopg = svg.append("g").attr("class", "leaflet-zoom-hide stops");
          var path = d3.geo.path().projection($scope.project);
          var bounds = d3.geo.bounds(routes);
          
          $scope.routes =[];
          $scope.stops = [];
          
          var feature=g.selectAll("path.route")
            .data(routes.features)
          .enter().append("path")
            .attr("class", function(d) { 
                $scope.routes.push(d.properties);
                return "route"; })
            .attr("d", path)
            .attr("stroke",function(d){ 
              if(typeof d.properties.route_color == 'undefined'){
                return "#0f0";
              }else{
                return "#"+d.properties.route_color;
              }
            })
            .on("mouseover", function(d){
              var textTitle = "<p>";
              textTitle += "<strong>Route ID:</strong>" + d.properties["route_id"] + "<br>";
              textTitle += "<strong>Route Short Name:</strong>" + d.properties['route_short_name'] + "<br>";
              textTitle += "<strong>Route Long Name:</strong>" + d.properties['route_long_name']+ "<br>";
              $("#info").show().html(textTitle);
            })
            .on("mouseout", function(self) {
              $("#info").hide().html("");
            });

          var stopfeature = stopg.selectAll("circle.stop")
            .data(stops.features)
          .enter()
            .append("circle")
            .classed("stop", true)
            .attr({
              r: 2,
              cx: function(d,i) {
                $scope.stops.push(d.properties); 
                return $scope.project(d.geometry.coordinates)[0]; 
              },
              cy: function(d,i) { 
                return $scope.project(d.geometry.coordinates)[1]; 
              },
              "fill": '#ED3A2D'
            })
            .on("mouseover", function(d){
              var textTitle = "<p>";
              textTitle += "<strong>Stop ID:</strong>" + d.properties["stop_id"] + "<br>";
              textTitle += "<strong>Stop Code:</strong>" + d.properties['stop_code'] + "<br>";
              textTitle += "<strong>Stop Name:</strong>" + d.properties['stop_name']+ "<br>";
              $("#info").show().html(textTitle);
            })
            .on("mouseout", function(self) {
              $("#info").hide().html("");
            });

            $scope.leafletMap.on("viewreset", function(){
              $scope.reset(bounds,feature,svg,g,path);
              $scope.reset(bounds,stopfeature,svg,stopg,path);
            });
            //$scope.leafletMap.fitBounds([bounds[0].reverse(),bounds[1].reverse()]);
            $scope.reset(bounds,feature,svg,g,path);
            $scope.reset(bounds,stopfeature,svg,stopg,path);
        });
      });
      $scope.loaded = true;
      $scope.loaded_agency = $scope.agencies[$scope.current_agency];
    };
    //$scope.loadAgency(1);

    $scope.project = function(x) {
              var point = $scope.leafletMap.latLngToLayerPoint(new L.LatLng(x[1], x[0]));
              return [point.x, point.y];
    }; 

    $scope.reset =function(bounds,feature,svg,g,path) {            
        var bottomLeft = $scope.project(bounds[0]),
        topRight = $scope.project(bounds[1]);
        
        svg .attr("width", topRight[0] - bottomLeft[0])
          .attr("height", bottomLeft[1] - topRight[1])
          .style("margin-left", bottomLeft[0] + "px")
          .style("margin-top", topRight[1] + "px");

        g.attr("transform", "translate(" + -bottomLeft[0] + "," + -topRight[1] + ")");

          if(feature.attr('cx') == null){
          //polygons only need path updated 
            feature
              .attr("d", path);
          }
          else{
            feature  
              .attr("cx", function(d) {
                return $scope.project(d.geometry.coordinates)[0];
              })
              .attr("cy", function(d) {
                return $scope.project(d.geometry.coordinates)[1]; 
              });
          } 
    };

    $scope.setLocation = function(e){
      console.log('test',e);
    };

});

