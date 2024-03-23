// global map
var map2 = null;

// =================== Element 01 ========================
queue()
    .defer(d3.json,"/init_element_01/json_all_earthquakes")
	.defer(d3.json,"/init_element_02/json_all_networks")
    .await(plot_element01);

function plot_element01(error, input, all_networks) {
	// ------ plot dropdown menu
	var on_click_network = "ALL"
	$.getJSON('/on_click_element_02', {"network": on_click_network});
	console.log(on_click_network)

	var stations = all_networks
	stations.unshift("ALL")

	var form = document.createElement("form");
	form.id = "stationSelectionForm"

	var form_div = document.getElementById("Network");

	var label = document.createElement("label");
	label.innerHTML = "Selected Station:";

	form.appendChild(label)

	var select = document.createElement("select")
	select.name = "stationSelection"
	select.id = "stationSelection"

	for (var i = 0; i < stations.length; i++) {
		var new_option = document.createElement("option");
		new_option.value = stations[i];
		new_option.innerHTML = stations[i]

		select.appendChild(new_option);
	}

	form.appendChild(select)
	form_div.appendChild(form)

	function getStation() {
		var selectElem = document.getElementById("stationSelection")
		on_click_network = selectElem.options[selectElem.selectedIndex].value
		var attr_nwchange = document.getElementById("Network");
		attr_nwchange.setAttribute("class", on_click_network);
		$.getJSON('/on_click_element_02', {"network": on_click_network});
		console.log(on_click_network)
	}

	d3.select("#stationSelection").on("change", getStation)
	//d3.select("#stationSelection").on("change", render_callback)

	// ------ plot range slider
	var timeFormat = d3.time.format("%Y-%m");

	function render_timechart(error, eq_counts) {
		var earthquake_counts = eq_counts;
		var width = 600;
		var height = 150;
		var timeChart = dc.barChart('#time_interval');

		var xScale = d3.time.scale()
			.domain([d3.min(earthquake_counts, function (d) {
				return new Date(d["_id"]);
			}), d3.max(earthquake_counts, function (d) {
				return new Date(d["_id"]);
			})])
			.range([0, width]);
		var yScale = d3.scale.linear()
			.domain([0, d3.max(earthquake_counts, function (d) {
				return d["count"];
			})])
			.range([height, 0]);

		var cross = crossfilter(earthquake_counts);
		var dateDim = cross.dimension(function (d) {
			return new Date(d["_id"]);
		});
		var eventCounts = dateDim.group().reduceSum(function (d) {
			return d["count"];
		});
		var timeChart = dc.barChart("#time-chart");

		timeChart
			.width(width)
			.height(height)
			.margins({top: 10, right: 50, bottom: 40, left: 35})
			.dimension(dateDim)
			.group(eventCounts)
			.brushOn(true)
			.x(xScale)
			.y(yScale)
			.gap(30)
			.centerBar(true)
			.xUnits(function () {
				return 20;
			})
			.xAxisLabel("Year/Month")
			.yAxisLabel("Number of Events");

		timeChart.render();

		timeChart.on('filtered', function (chart, filter) {
			if (filter && filter.length) {
				var network = on_click_network;
				console.log(network);
				var on_click_time_begin = timeFormat(new Date(filter[0]));
				var on_click_time_end = timeFormat(new Date(filter[1]));
				console.log(on_click_time_begin, on_click_time_end, network);
				// filter data according to time range chosen
				var data_in_range = all_map_data.filter(function (d) {
					return d.stringDate >= on_click_time_begin && d.stringDate <= on_click_time_end
				});
				console.log(data_in_range);
				if (network == "ALL") {
					data = data_in_range
				}
				else {
				var data = data_in_range.filter(function (d) {
					return d.network == network;
				});
				}
				console.log(data);

				// recreate new feature group

				var shelterMarkers = new L.FeatureGroup();
				// create feature group for markers
				for (var i in data) {
					var row = data[i];
					if (row.earthquake_id != undefined) {
						var marker = L.circleMarker([row.evt_lat, row.evt_lon], {
							opacity: 1,
							radius: 6,
							color: 'red',
							fillcolor: 'red'
						});
						marker.id = row.earthquake_id;
						marker.event_time = row.event_time;
						marker.evt_mag = row.evt_mag;
						marker.evt_dep = row.evt_dep;
						marker.bindPopup(row.earthquake_id);
						shelterMarkers.addLayer(marker);
					}
				}
				map.on('zoomend', function () {
					if (map.getZoom() < 7) {
						map.removeLayer(shelterMarkers);
					} else {
						var features = [];
						map.addLayer(shelterMarkers);
						map.eachLayer(function (layer) {
							if (layer instanceof L.Marker) {
								if (map.getBounds().contains(layer.getLatLng())) {
									features.push(layer.feature);
								}
							}
						});
					}
				});
				shelterMarkers.eachLayer(function (layer) {
					layer.on('click', function () {
						var marker_id = shelterMarkers.getLayerId(layer);
						var on_click_earthquake_id = shelterMarkers._layers[marker_id]["id"];
						var on_click_earthquake_time = new Date(shelterMarkers._layers[marker_id]["event_time"]["$date"]);
						var on_click_earthquake_magnitude = shelterMarkers._layers[marker_id]["evt_mag"];
						var on_click_earthquake_depth = shelterMarkers._layers[marker_id]["evt_dep"];

						// write to element 4
						console.log(on_click_earthquake_time);
						var earthquake_info = d3.select("#number-events");
						earthquake_info.selectAll("p").remove();
						earthquake_info.append("p")
							.text("Earthquake ID:  " + on_click_earthquake_id)
							.append("p")
							.text("Date/Time:  " + on_click_earthquake_time)
							.append("p")
							.text("Magnitude:  " + on_click_earthquake_magnitude)
							.append("p")
							.text("Depth:  " + on_click_earthquake_depth + "  km");
						var attrtag = document.getElementById("number-events");
						attrtag.setAttribute("class", on_click_earthquake_id);
						$.getJSON('/on_click_element_01', {"earthquake_id": on_click_earthquake_id});
						console.log(on_click_earthquake_id);
					});
				});
				$.getJSON('/on_click_element_03', {
					"begin_time": on_click_time_begin,
					"end_time": on_click_time_end, "network": network
				});
			}
		});
	}
	// initial render
	queue()
		.defer(d3.json,"/init_element_03/json_eq_counts")
		.await(render_timechart)

	var all_map_data = input;

  	// set plotting
	var map = L.map('map').setView([40, -100.7129], 4);
	// map tile
	L.tileLayer('https://api.maptiler.com/maps/topo/{z}/{x}/{y}.png?key=11GdBkCMuhzyacQ0k2nl', {
		attribution: '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>'
	}).addTo(map);
	// inital bounding boxes
	var CI = L.rectangle(
		[[32.0, -120.0],
			[32.0, -116.0],
			[36.0, -120.0],
			[36.0, -116.0]],
		{
			color: '#E8707C',
			weight: 2
		}
	);
	var UW = L.rectangle(
		[[41.0, -125.0],
			[41.0, -116.0],
			[49.0, -125.0],
			[49.0, -116.0]],
		{
			color: '#B96492',
			weight: 2
		}
	);
	var OK = L.rectangle(
		[[33.0, -100.0],
			[33.0, -94.0],
			[37.0, -100.0],
			[37.0, -94.0]],
		{
			color: '#fc8d59',
			weight: 2
		}
	);
	var CN = L.rectangle(
		[[48.26, -129.5],
			[48.26, -121.42],
			[51.05, -129.5],
			[51.05, -121.42]],
		{
			color: '#7E6092',
			weight: 2
		}
	);
	// currently in a overlay
	var bounding_boxes = L.layerGroup([CI, UW, OK, CN]);
	var overlay = {
		'bounds': bounding_boxes
	};
	L.control.layers(null, overlay).addTo(map);
	bounding_boxes.addTo(map);

	//var on_click_time_begin = timeFormat(new Date(d3.min(earthquake_counts, function (d) {
	//	return new Date(d["_id"]);
	//})));

	//var on_click_time_end = timeFormat(new Date(d3.max(earthquake_counts, function (d) {
	//	return new Date(d["_id"]);
	//})));

	let target_sta_node = document.querySelector("#Network");
	const nwconfig = {attributes: true};
	const render_callback = function (mutationsList, observer) {
		// Use traditional 'for loops' for IE 11
		for (const mutation of mutationsList) {
			if (mutation.type === 'attributes') {
				console.log('The ' + mutation.attributeName + ' network attribute was modified.');
				queue()
					.defer(d3.json,"/init_element_03/json_eq_counts")
					.await(render_timechart)
			}
		}
	};
	const network_observer = new MutationObserver(render_callback);
	// Start observing the target node for configured mutations
	network_observer.observe(target_sta_node, nwconfig);

};

// =================== Element 07 ========================
let targetNode = document.querySelector("#number-events");
const config = { attributes: true, childList: false, subtree: false };
const callback = function(mutationsList, observer) {
    // Use traditional 'for loops' for IE 11
    for(const mutation of mutationsList) {
        if (mutation.type === 'attributes') {
			console.log('The ' + mutation.attributeName + ' attribute was modified.');
			// =================== Element 05 ========================
			queue()
				.defer(d3.json, "/input_of_element_05/ground_truth")
				.defer(d3.json, "/input_of_element_05/ground_truth_stations")
				.defer(d3.json, "/input_of_element_05/exps")
				.await(plot_element05)

			function plot_element05(error, ground_truth, ground_truth_stations, exps) {
				console.log(ground_truth)
				console.log(ground_truth_stations)
				console.log(exps)
				if (map2 != undefined) {
					map2.remove();
				}
				map2 = L.map('map2').setView([40, -100.7129], 4);
				// map tile
				L.tileLayer('https://api.maptiler.com/maps/topo/{z}/{x}/{y}.png?key=11GdBkCMuhzyacQ0k2nl', {
				attribution: '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>'
				}).addTo(map2);

                // black triangle
                var black_triangle = L.icon({
                    iconUrl: 'static/images/black_triangle.png',
                    iconSize: [8, 8]
                });

                // blue triangle
                var blue_triangle = L.icon({
                    iconUrl: 'static/images/blue_triangle.png',
                    iconSize: [8, 8]
                });

				// simplified json
				var gt = ground_truth[0];
				var st = ground_truth_stations[0];

                // ground truth marker
                var ground_truth_marker = L.circleMarker([gt.evt_lat, gt.evt_lon], {
                    opacity: 1,
					radius: 6,
					color: 'red',
					fillcolor: 'red',
					pane: 'tooltipPane'
                }).addTo(map2);

				ground_truth_marker.on('click', function() {
					clear_highlight();
				});

				// for knowing which markers highlighted
				var blue_exp_id = null;
				var blue_stations = null;

				// for setting map zoom
				var min_lat = null;
				var max_lat = null;
				var min_lon = null;
				var max_lon = null;

                // stations
                var station_markers = new L.FeatureGroup();
                
                for (var i in gt.stations) {
					var station = st.station_data.find(function(s, index) {
						if (s.station_name == gt.stations[i]) {
							return true;
						}
					});
					var marker = L.marker([station.station_lat, station.station_lon], {
                        icon: black_triangle
                    });

					marker.station_name = station.station_name;
                    marker.station_lat = station.station_lat;
                    marker.station_lon = station.station_lon;


					// simple way to get center

					if (min_lat == undefined) {
						min_lat = marker.station_lat;
					} else if (marker.station_lat < min_lat) {
						min_lat = marker.station_lat;
					}

					if (max_lat == undefined) {
						max_lat = marker.station_lat;
					} else if (marker.station_lat > max_lat) {
						max_lat = marker.station_lat;
					}

					if (min_lon == undefined) {
						min_lon = marker.station_lon;
					} else if (marker.station_lon < min_lon) {
						min_lon = marker.station_lon;
					}

					if (max_lon == undefined) {
						max_lon = marker.station_lon;
					} else if (marker.station_lon > max_lon) {
						max_lon = marker.station_lon;
					}

                    marker.bindPopup(marker.station_name + '<br>lat: ' 
                    + marker.station_lat + '<br>lon: ' + marker.station_lon);

					station_markers.addLayer(marker);
				}

				station_markers.addTo(map2);

				// exp
				var exp_markers = new L.FeatureGroup();

				for (var i in exps) {
					var exp = exps[i];
					var marker = L.circleMarker([exp.evt_lat, exp.evt_lon], {
						opacity: 1,
						radius: 6,
						color: 'gray',
						fillcolor: 'gray'
					});

					marker.exp_id = exp.exp_id;
					marker.evt_lat = exp.evt_lat;
					marker.evt_lon = exp.evt_lon;
					marker.stations = exp.stations;

					// simple way to get center

					if (min_lat == undefined) {
						min_lat = marker.evt_lat;
					} else if (marker.evt_lat < min_lat) {
						min_lat = marker.evt_lat;
					}

					if (max_lat == undefined) {
						max_lat = marker.evt_lat;
					} else if (marker.evt_lat > max_lat) {
						max_lat = marker.evt_lat;
					}

					if (min_lon == undefined) {
						min_lon = marker.evt_lon;
					} else if (marker.evt_lon < min_lon) {
						min_lon = marker.evt_lon;
					}

					if (max_lon == undefined) {
						max_lon = marker.evt_lon;
					} else if (marker.evt_lon > max_lon) {
						max_lon = marker.evt_lon;
					}

					marker.bindPopup(marker.exp_id + '<br>lat: ' 
                    + marker.evt_lat + '<br>lon: ' + marker.evt_lon);

					// highlight
					marker.on('click', function(e) {
						highlight_stations(e.target);
					});

					exp_markers.addLayer(marker);

				}

				exp_markers.addTo(map2);

				//map2.on('click', clear_highlight());

				// some zoomer things

				//var zoom = Math.floor((Math.abs(max_lat-min_lat)*Math.abs(max_lon-min_lon)/(1.8)))
				var zoom = 5;
				map2.setView([((min_lat+max_lat)/2), ((min_lon+max_lon)/2)], zoom);

				function clear_highlight() {
					if (blue_exp_id != undefined) {
						exp_markers.eachLayer(function(layer) {
							if (layer.exp_id == blue_exp_id) {
								layer.setStyle({color: 'gray'});
							}
						});
						for (var i in blue_stations) {
							station_markers.eachLayer(function(layer) {
								if (layer.station_name == blue_stations[i]) {
									layer.setIcon(black_triangle);
								}
							});
						}
						blue_exp_id = null;
						blue_stations = null;
					}
				}

				function highlight_stations(exp) {
					clear_highlight();

					exp.setStyle({
						opacity: 1,
						radius: 6,
						color: 'blue',
						fillcolor: 'blue'
					});

					for (var i in exp.stations) {
						station_markers.eachLayer(function(layer) {
							if (layer.station_name == exp.stations[i]) {
								layer.setIcon(blue_triangle);
							}
						});
					}

					blue_exp_id = exp.exp_id;
					blue_stations = exp.stations;
				}


			}

			// =================== Element 06 ========================
			queue()
				.defer(d3.json, "/input_of_element_06/json_errs")
				.await(plot_element06);

			function plot_element06(error, input) {
				console.log(input);
				if (input.length >= 1) {
					var latitudeChart = dc.rowChart("#barchart1-1");
					var longitudeChart = dc.rowChart("#barchart1-2");

					var cross = crossfilter(input);
					var expDim = cross.dimension(function (d) {
						return d["exp_id"];
					});
					var latitudeError = expDim.group().reduceSum(function (d) {
						return d["evt_lat_err"];
					});
					var longitudeError = expDim.group().reduceSum(function (d) {
						return d["evt_lon_err"];
					});

					latitudeChart
						.width(300)
						.height(380)
						.dimension(expDim)
						.group(latitudeError)
						.xAxis().ticks(4);

					longitudeChart
						.width(300)
						.height(380)
						.dimension(expDim)
						.group(longitudeError)
						.xAxis().ticks(4);

					latitudeChart.render();
					longitudeChart.render();
				}

			// =================== Element 07 ========================
			queue()
				.defer(d3.json, "/input_of_element_07/json_errs")
				.await(plot_element07);

			function plot_element07(error, input) {

				var depthChart = dc.rowChart("#barchart2-1");
				var magnitudeChart = dc.rowChart("#barchart2-2");

				var cross_07 = crossfilter(input);
				var expDim_07 = cross_07.dimension(function (d) {return d["exp_id"];});
				var depthError = expDim_07.group().reduceSum(function (d) {
						return d["evt_dep_err"];
					});
				var magnitudeError = expDim_07.group().reduceSum(function (d) {
						return d["evt_mag_err"];
					});

					depthChart
						.width(300)
						.height(380)
						.dimension(expDim_07)
						.group(depthError)
						.xAxis().ticks(4);

					magnitudeChart
						.width(300)
						.height(380)
						.dimension(expDim_07)
						.group(magnitudeError)
						.xAxis().ticks(4);

					depthChart.render();
					magnitudeChart.render();
}
        }
    }
};
}
const observer = new MutationObserver(callback);
// Start observing the target node for configured mutations
observer.observe(targetNode, config);