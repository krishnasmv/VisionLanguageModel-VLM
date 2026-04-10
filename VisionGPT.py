from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
import clip
from PIL import Image
import io
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)

device = "cpu"  # force CPU for Render free tier
print(f"Device: {device}")

print("Loading CLIP model...")
model, preprocess = clip.load("ViT-B/32", device=device)
print("✅ CLIP loaded")

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "ok",
        "device": device,
        "model": "CLIP ViT-B/32"
    })

@app.route('/caption', methods=['POST'])
def caption_image():
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file"}), 400
        
        file = request.files['file']
        image = Image.open(io.BytesIO(file.read())).convert("RGB")

        prompts = [
            "a photograph of",
            "a picture showing",
            "an image of",
            "a scene with"
        ]

        image_input = preprocess(image).unsqueeze(0).to(device)

        with torch.no_grad():
            image_features = model.encode_image(image_input)
            image_features /= image_features.norm(dim=-1, keepdim=True)

            text_inputs = clip.tokenize(prompts).to(device)
            text_features = model.encode_text(text_inputs)
            text_features /= text_features.norm(dim=-1, keepdim=True)

            similarity = (image_features @ text_features.T).softmax(dim=-1)
            scores = similarity[0].cpu().numpy()

        best_idx = scores.argmax()

        return jsonify({
            "caption": f"This is {prompts[best_idx]}",
            "confidence": float(scores[best_idx]),
            "timestamp": datetime.now().isoformat()
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/classify', methods=['POST'])
def classify_image():
    try:
        if 'file' not in request.files or 'classes' not in request.form:
            return jsonify({"error": "Missing file or classes"}), 400
        
        file = request.files['file']
        classes = [c.strip() for c in request.form['classes'].split(',')]

        image = Image.open(io.BytesIO(file.read())).convert("RGB")
        image_input = preprocess(image).unsqueeze(0).to(device)

        with torch.no_grad():
            image_features = model.encode_image(image_input)
            image_features /= image_features.norm(dim=-1, keepdim=True)

            prompts = [f"a photo of a {cls}" for cls in classes]
            text_inputs = clip.tokenize(prompts).to(device)
            text_features = model.encode_text(text_inputs)
            text_features /= text_features.norm(dim=-1, keepdim=True)

            similarity = (image_features @ text_features.T).softmax(dim=-1)
            scores = similarity[0].cpu().numpy()

        best_idx = scores.argmax()

        return jsonify({
            "predicted_class": classes[best_idx],
            "confidence": float(scores[best_idx])
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)
