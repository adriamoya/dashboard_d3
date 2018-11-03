# -*- coding: utf-8 -*-

import pandas as pd

from flask import Flask
from flask import render_template
import json

data_path = './input/'

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/data")
def get_data():
    saldos_BS = pd.read_csv(data_path + 'saldos_BS4.csv',sep=";")
    print saldos_BS
    return saldos_BS.to_json(orient='records')


if __name__ == "__main__":
    app.run(host='0.0.0.0',port=5000,debug=True)