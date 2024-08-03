import os
import json
import sys
from werkzeug.utils import secure_filename
from disease import disease_dic
from PIL import Image
import numpy as np
from scipy.stats import skew, kurtosis

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max-limit

# Ensure upload folder exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_color_features(image):
    image_array = np.array(image)
    r, g, b = image_array[:,:,0], image_array[:,:,1], image_array[:,:,2]
    
    features = {}
    for channel, name in zip([r, g, b], ['red', 'green', 'blue']):
        features[f'{name}_mean'] = np.mean(channel)
        features[f'{name}_std'] = np.std(channel)
        features[f'{name}_skew'] = skew(channel.ravel())
        features[f'{name}_kurtosis'] = kurtosis(channel.ravel())
    
    return features

def get_texture_features(image):
    gray = image.convert('L')
    gray_array = np.array(gray)
    
    features = {}
    features['contrast'] = np.std(gray_array)
    features['smoothness'] = 1 - (1 / (1 + np.sum(np.square(gray_array))))
    
    return features

def get_shape_features(image):
    binary = image.convert('1')
    binary_array = np.array(binary)
    
    features = {}
    features['aspect_ratio'] = image.width / image.height
    features['area_ratio'] = np.sum(binary_array) / (image.width * image.height)
    
    return features

def identify_crop_and_disease(image_path):
    image = Image.open(image_path).convert('RGB')
    
    color_features = get_color_features(image)
    texture_features = get_texture_features(image)
    shape_features = get_shape_features(image)
    
    features = {**color_features, **texture_features, **shape_features}
    
    # Simple rule-based classification using the extracted features
    if features['green_mean'] > features['red_mean'] and features['green_mean'] > features['blue_mean']:
        if features['contrast'] > 50:
            if features['area_ratio'] < 0.5:
                return "Tomato___Bacterial_spot"
            else:
                return "Tomato___Leaf_Mold"
        elif features['smoothness'] > 0.9:
            return "Tomato___healthy"
        else:
            return "Potato___Early_blight"
    elif features['red_mean'] > features['green_mean'] and features['red_mean'] > features['blue_mean']:
        if features['red_skew'] > 0:
            return "Apple___Cedar_apple_rust"
        else:
            return "Strawberry___Leaf_scorch"
    elif features['blue_mean'] > features['red_mean'] and features['blue_mean'] > features['green_mean']:
        return "Blueberry___healthy"
    else:
        if features['aspect_ratio'] > 1.5:
            return "Corn_(maize)___Northern_Leaf_Blight"
        else:
            return "Grape___Black_rot"

def handle_file_upload(file_path):
    prediction = identify_crop_and_disease(file_path)
    disease_info = disease_dic.get(prediction, "Unknown crop/disease combination")
    return {"prediction": disease_info, "disease_name": prediction}

if __name__ == '__main__':
    if len(sys.argv) > 1:
        file_path = sys.argv[1]
        result = handle_file_upload(file_path)
        print(json.dumps(result))
    else:
        print(json.dumps({"error": "No file path provided"}))
