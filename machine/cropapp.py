
import pandas as pd
import joblib
import argparse

# Load your trained model and feature names
model = joblib.load('machine/crops_model.pkl')
feature_names = joblib.load('machine/feature_names.pkl')

def predict_crop(data: dict):
    try:
        province = data['province']
        district = data['district']
        month = data['month']
        soil_type = data['soil_type']
        rainfall = float(data['rainfall'])
        temperature = float(data['temperature'])
        
        # Create a DataFrame for the input data
        input_data = pd.DataFrame([[province, district, month, soil_type, rainfall, temperature]],
                                  columns=['Province', 'District', 'Month', 'Soil_Type', 'Rainfall', 'Temperature'])
        
        # Encode categorical variables
        input_data = pd.get_dummies(input_data)
        
        # Reindex the input data to match the training data's columns
        input_data = input_data.reindex(columns=feature_names, fill_value=0)
        
        # Predict the crop
        prediction = model.predict(input_data)
        
        return prediction[0]
    except Exception as e:
        return str(e)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Predict crop based on input parameters.')
    parser.add_argument('--province', required=True, help='Province of the area')
    parser.add_argument('--district', required=True, help='District of the area')
    parser.add_argument('--month', required=True, help='Month of the year')
    parser.add_argument('--soil_type', required=True, help='Type of the soil')
    parser.add_argument('--rainfall', required=True, type=float, help='Amount of rainfall')
    parser.add_argument('--temperature', required=True, type=float, help='Temperature of the area')

    args = parser.parse_args()

    data = {
        'province': args.province,
        'district': args.district,
        'month': args.month,
        'soil_type': args.soil_type,
        'rainfall': args.rainfall,
        'temperature': args.temperature
    }

    prediction = predict_crop(data)
    print(prediction)