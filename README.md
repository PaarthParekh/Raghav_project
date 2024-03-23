# Demo
![demo](https://github.com/Lchuang/CSE6242_course_project/blob/main/Code/demo.gif)

# Description

This project examines the use of a GNN model to perform Earthquake Early Warning, utilizing an interactive visualization to better understand the model efficacy and draw observations from the results.

There are three main components included - jupyter notebooks to create a GNN model for predicting seismic event characteristics, a MongoDB database for storing experimental prediction results and related data, and a Flask/D3.js website for producing the interactive visualization.
The GNN codes are modified from van den Ende & Ampuero (2020): "Automated Seismic Source Characterization Using Deep Graph Neural Networks", published in Geophysical Research Letters (doi:10.1029/2020GL088690)

# Installation
## Installing Experiment and Visulization Packages
First, make sure to have Conda (https://conda.io/) and Jupyter Notebook (https://jupyter.org/) installed.

The `environment.yml` file in the root directory lists the necessary packages for running the jupyter notebooks and the flask app - this can be used to create a conda virtual environment with said packages installed.

To create the virtual environment `EEW_env`, run the following command in the root repo directory (using terminal/command prompt):
> `conda env create -f environment.yml`

After installation is complete, the virtual environment can be activated through the following command:
> `conda activate EEW_env`

Finally, we link the environment with jupyter notebook (create the kernel) with the following command:
> `python -m ipykernel install --name=EEW_env`

To open the jupyter notebooks after activating the virtual environment, change to the `/Code/GNN` directory and run `jupyter notebook`.  The following is a breakdown of the three included notebooks:

1. Download data and data pre-processing
    - Open the Jupyter notebook named `01_download_data.ipynb` under /Code/GNN  
2. GNN Model training
    - Open the Jupyter notebook named `02_train_model.ipynb` under /Code/GNN
3. Run experiments
    - Open the Jupyter notebook named `03_evaluate_for_incomplete_data.ipynb` under /Code/GNN

Make sure that jupyter notebook is using the `EEW_env` kernel (`EEW_env` should be displayed in the top right, under the Logout button).  If it is not, go to **Kernel** -> **Change kernel** and select `EEW_env`.

## MongoDB Installation
1. Download Community Server https://www.mongodb.com/try/download/community
2. Install MongoDB Community through terminal, type `brew tap mongodb/brew`
3. Install MongoDB, type `brew install mongodb-community@4.4`
4. Connect and use Mongo, type `mongo` in terminal
5. Download Mongo Compress https://www.mongodb.com/try/download/compass
Follow the instruction `MongoDB setup.pdf` under/Code/Database

# Execution
## Database construction
1. Create Database "EEW" for collection storage
2. Create collection "experiments", "ground_truth_lookup", "station_lookup"
3. Import collection from `experiments.json`, `ground_truth_lookup.json`, `station_lookup.json` under /Code/Database/database
## Data visualization
To run the interactive visualization, be sure that the MongoDB database is set up and running. Then, while in the /Code/visualization directory in the terminal, type:
> `python app.py`

Simply visit the link given in the output in your browser.
