from flask import Flask, request, jsonify
from module import front_function  # import from your module
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route("/weather", methods=["GET"])
def weather_api():
    try:
        lat = float(request.args.get("lat"))
        lon = float(request.args.get("lon"))
        dd1 = int(request.args.get("dd1"))
        mm1 = int(request.args.get("mm1"))
        yy1 = int(request.args.get("yy1"))
        dd2 = int(request.args.get("dd2"))
        mm2 = int(request.args.get("mm2"))
        yy2 = int(request.args.get("yy2"))
        
        
    except Exception:
        return jsonify({"error": "Invalid or missing parameters"}), 400

    data = front_function(yy1,yy2, dd1, mm1, dd2, mm2, lat, lon)
    return jsonify(data)

if __name__ == "__main__":
    app.run(debug=False)
