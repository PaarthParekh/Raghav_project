from flask import Flask
from flask import render_template, request
from pymongo import MongoClient
import json
from bson import json_util
from bson.json_util import dumps

app = Flask(__name__)

# ----- Set up mongoDB connection
MONGODB_HOST = 'localhost'
MONGODB_PORT = 27017
DBS_NAME = 'EEW'
connection = MongoClient(MONGODB_HOST, MONGODB_PORT)

# ----- Use this class to hold variables
class variables():
    def __init__(self, network, begin_time, end_time, earthquake_id, event_selected):
        self.network = network
        self.begin_time = begin_time
        self.end_time = end_time
        self.earthquake_id = earthquake_id
        self.event_selected = event_selected

vars = variables("ALL","2000-01","2021-01","GT10000",False)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/init_element_01/json_all_earthquakes")
def get_init_element_01():
    #network = vars.network
    begin_time = vars.begin_time
    end_time = vars.end_time
    collection = connection[DBS_NAME]["ground_truth_lookup"]
    # ---- return selected earthquakes
    pipeline = [
        {"$addFields": {"stringDate": {"$dateToString": {"format": "%Y-%m", "date": "$event_time"}}}},
        {"$match": {
            "$and": [
                {"stringDate": {"$gte": begin_time, "$lt": end_time}},
            ]}},
        {"$project": {"_id": False, "evt_lat": 1, "evt_lon": 1, "earthquake_id": 1,
                      'evt_mag': 1, 'evt_dep': 1, 'event_time': 1, "stringDate": 1, "network": 1}},
    ]
    all_earthquakes = collection.aggregate(pipeline)
    json_all_earthquakes = json.dumps(list(all_earthquakes), default=json_util.default)
    return json_all_earthquakes

@app.route("/init_element_02/json_all_networks")
def get_init_element_02():
    collection = connection[DBS_NAME]["station_lookup"]
    all_networks = list(collection.distinct("network"))
    print(all_networks)
    json_all_networks = json.dumps(all_networks, default=json_util.default)
    return json_all_networks

@app.route("/init_element_03/json_eq_counts")
def get_init_element_03():
    network = vars.network
    collection = connection[DBS_NAME]["ground_truth_lookup"]
    if network == "ALL":
        pipeline = [
            {"$group": {"_id": "$stringDate", "count": {"$sum": 1}}}
        ]
    else:
        pipeline = [
            {"$match": {"network": network}},
            {"$group": {"_id":"$stringDate", "count":{"$sum":1}}}
        ]
    eq_counts = collection.aggregate(pipeline)
    json_eq_counts = json.dumps(list(eq_counts), default=json_util.default)
    return json_eq_counts

@app.route('/on_click_element_01', methods=['GET','POST'])
def get_on_click_element_01():
    # ----- get on click vars -----
    vars.earthquake_id = request.args.get('earthquake_id', type=str)
    vars.event_selected = True
    print(vars.earthquake_id)
    return json.dumps([{}], default=json_util.default)

@app.route('/on_click_element_02', methods=['GET','POST'])
def get_on_click_element_02():
    # ----- get on click vars -----
    vars.network = request.args.get('network', type=str)
    print(f"user selected network : {vars.network}")
    return json.dumps([{}], default=json_util.default)

@app.route("/on_click_element_03")
def get_on_click_element_03():
    # ----- get on click vars -----
    vars.network = request.args.get('network', type=str)
    vars.begin_time = request.args.get('begin_time', type=str)
    vars.end_time = request.args.get('end_time', type=str)
    print(f"user selected network : {vars.network}, begin_time: {vars.begin_time}, end_time: {vars.end_time}")
    return json.dumps([{}], default=json_util.default)

@app.route("/init_element_04/eq_texts")
def get_eqinfo_for_element_04():
    if vars.event_selected is True:
        # ---- info of the elements
        earthquke_id = vars.earthquake_id
        collection = connection[DBS_NAME]["ground_truth_lookup"]
        query1 = {"earthquake_id": earthquke_id}
        query2 = {'event_time': True, 'evt_dep': True, 'evt_lat': True, 'evt_lon': True, 'evt_mag':True, '_id': False}
        results = list(collection.find(query1, query2))
        eq_texts = json.dumps(results, default=json_util.default)
        return eq_texts
    else:
        # ---- return empty json
        return json.dumps([{}], default=json_util.default)

@app.route("/input_of_element_05/ground_truth")
def get_ground_truth_element_05():
    if vars.event_selected is True:
        # ---- info of the elements
        earthquke_id = vars.earthquake_id
        collection = connection[DBS_NAME]["ground_truth_lookup"]
        query1 = {"earthquake_id": earthquke_id}
        query2 = {'evt_dep': True,'stations':True,'evt_lat': True, 'evt_lon': True, 'evt_mag': True, '_id': False}
        results = list(collection.find(query1, query2))
        ground_truth = json.dumps(results, default=json_util.default)
        return ground_truth
    else:
        # ---- return empty json
        return json.dumps([{}], default=json_util.default)

@app.route("/input_of_element_05/ground_truth_stations")
def get_ground_truth_stations_element_05():
    if vars.event_selected is True:
        # ---- info of the stations associated with the ground truth
        earthquke_id = vars.earthquake_id
        collection = connection[DBS_NAME]["ground_truth_lookup"]
        station_lookup = connection[DBS_NAME]["station_lookup"]
        print(collection)
        pipeline = [
            {"$match": {"earthquake_id": earthquke_id}},
            {"$lookup": {"from": "station_lookup",
                         "localField": "station_name", "foreignField": "stations", "as": "station_data"}
            },
            { "$project": {"earthquake_id": earthquke_id, "station_data.station_name": 1,
                           "station_data.station_lat": 1, "station_data.station_lon": 1,
                           "_id": 0}}
        ]
        gt_stations = collection.aggregate(pipeline)
        ground_truth_stations = json.dumps(list(gt_stations), default=json_util.default)
        return ground_truth_stations
    else:
        # ---- return empty json
        return json.dumps([{}], default=json_util.default)

@app.route("/input_of_element_05/exps")
def get_exps_element_05():
    if vars.event_selected is True:
        # ---- info of the elements
        print(vars.earthquake_id)
        earthquke_id = vars.earthquake_id
        collection = connection[DBS_NAME]["experienments"]
        query1 = {"earthquake_id": earthquke_id}
        query2 = {'exp_id': True, 'stations': True, 'evt_lat': True, 'evt_lon': True,
                  'evt_dep':True, 'evt_mag':True, '_id': False}
        results = list(collection.find(query1, query2))
        exps = json.dumps(results, default=json_util.default)
        return exps
    else:
        return json.dumps([{}], default=json_util.default)

@app.route("/input_of_element_06/json_errs")
def get_inputs_element_06():
    if vars.event_selected is True:
        # ---- info of the elements
        print(vars.earthquake_id)
        earthquke_id = vars.earthquake_id
        collection = connection[DBS_NAME]["experienments"]
        query1 = {"earthquake_id": earthquke_id}
        query2 = {'exp_id': True, 'evt_lat_err': True, 'evt_lon_err': True, '_id': False}
        results = list(collection.find(query1, query2))
        json_errs = json.dumps(results, default=json_util.default)
        return json_errs
    else:
        return json.dumps([{}], default=json_util.default)

@app.route("/input_of_element_07/json_errs")
def get_inputs_element_07():
    if vars.event_selected is True:
        # ---- info of the elements
        earthquke_id = vars.earthquake_id
        collection = connection[DBS_NAME]["experienments"]
        query1 = {"earthquake_id": earthquke_id}
        query2 = {'exp_id': True, 'evt_dep_err': True, 'evt_mag_err': True, '_id': False}
        results = list(collection.find(query1, query2))
        json_errs = json.dumps(results, default=json_util.default)
        return json_errs
    else:
        return json.dumps([{}], default=json_util.default)

if __name__ == "__main__":
    app.run(host='0.0.0.0',port=5000,debug=True)
