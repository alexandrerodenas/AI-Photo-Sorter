import base64
import io
import logging
import os
from flask_socketio import SocketIO, emit
from urllib.parse import unquote

import numpy as np
from PIL import Image
from flask import Flask, request, jsonify
from flask_cors import CORS
from keras.src.applications.resnet import ResNet152
from tensorflow.keras.applications.vgg16 import preprocess_input, decode_predictions
from tensorflow.keras.preprocessing import image

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

resnet_model = ResNet152(weights='imagenet')

app = Flask(__name__)
CORS(app)

socketio = SocketIO(app, cors_allowed_origins=["http://localhost:5173"])

def is_photo(file):
    return file.endswith(('.png', '.jpg', '.jpeg'))

def get_photos_from_directory(photo_directory):
    for root, _, files in os.walk(photo_directory):
        if root[len(photo_directory):].count(os.sep) < 3:
            for file in files:
                if is_photo(file):
                    yield os.path.join(root, file)


@app.route('/photos', methods=['GET'])
def list_photos():
    photo_directory = unquote(request.args.get('directory'))
    if not photo_directory or not os.path.isdir(photo_directory):
        return jsonify({"error": "Invalid directory"}), 400

    photos = list(get_photos_from_directory(photo_directory))
    return jsonify({"count": len(photos)})

@socketio.on('stream_photos')
def stream_photos(data):
    photo_directory = data.get('directory')
    if not photo_directory or not os.path.isdir(photo_directory):
        emit('error', {'message': 'Invalid directory'})
        return

    for photo in get_photos_from_directory(photo_directory):
        try:
            with open(photo, "rb") as f:
                binary_data = base64.b64encode(f.read()).decode('utf-8')
                emit('photo', {'path': photo, 'binary': binary_data})
        except Exception as e:
            emit('error', {'message': f'Error processing {photo}: {str(e)}'})


@app.route('/photos/<filename>', methods=['DELETE'])
def delete_photo(filename):
    logger.info(f"Deleting photo: {filename}")
    os.chmod(filename, 0o777)
    if os.path.exists(filename):
        os.remove(filename)
        logger.info(f"Photo deleted: {filename}")
        return jsonify({"message": "Photo supprimée"}), 200
    logger.error(f"Photo not found: {filename}")
    return jsonify({"message": "Photo non trouvée"}), 404

@app.route('/detect', methods=['POST'])
def detect():
    if 'file' not in request.files:
        logger.error("No file part in the request")
        return jsonify({"error": "No file part"}), 400

    file = request.files['file']
    if file.filename == '':
        logger.error("No selected file")
        return jsonify({"error": "No selected file"}), 400

    try:
        with io.BytesIO(file.read()) as img_data:
            with Image.open(img_data) as img:
                if img.mode != 'RGB':
                    img = img.convert('RGB')

                img = img.resize((224, 224))
                x = image.img_to_array(img)
                x = np.expand_dims(x, axis=0)
                x = preprocess_input(x)

                resnet_preds = resnet_model.predict(x)
                resnet_decoded = decode_predictions(resnet_preds, top=3)[0]

                combined_preds =  [
                                     {'model': 'ResNet152', 'label': pred[1], 'score': float(pred[2])} for pred in resnet_decoded
                                 ]

                logger.info(f"Detection results: {combined_preds}")
                return jsonify(combined_preds)

    except Exception as e:
        logger.error(f"Error during detection: {str(e)}")
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)