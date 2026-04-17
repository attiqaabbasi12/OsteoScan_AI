import torch
import torchvision.transforms as transforms
from PIL import Image

# ── Import YOUR model definition ──────────────────────────────
from model.model_def import (
    SwinOrdinal,
    load_model,
    coral_logits_to_class_probs,
    probas_to_labels,
    CLASSES,
    IMG_SIZE,
)

# ─────────────────────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────────────────────
CONFIDENCE_THRESHOLD = 0.80

# ─────────────────────────────────────────────────────────────
# IMAGE TRANSFORMS  (must match training preprocessing)
# ─────────────────────────────────────────────────────────────
transform = transforms.Compose([
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std =[0.229, 0.224, 0.225]
    )
])

# ─────────────────────────────────────────────────────────────
# SINGLETON MODEL — loaded once at startup
# ─────────────────────────────────────────────────────────────
_model  = None
_device = None

def get_model(model_path: str):
    global _model, _device

    if _model is not None:
        return _model, _device

    _device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    _model  = load_model(model_path, _device)
    print(f"✅ SwinOrdinal model loaded from {model_path} on {_device}")
    return _model, _device


# ─────────────────────────────────────────────────────────────
# CLASSIFY IMAGE
# ─────────────────────────────────────────────────────────────
def classify_image(image_path: str, model_path: str) -> dict:
    """
    Classify a knee X-ray using SwinOrdinal + CORAL head.

    Returns:
    {
        'success'           : True/False,
        'predicted_class'   : 'Normal',
        'predicted_idx'     : 0,
        'confidence'        : 94.3,
        'all_probabilities' : {'Normal': 94.3, 'Osteopenia': 3.5, 'Osteoporosis': 2.2},
        'above_threshold'   : True,
        'message'           : '...',
        'pil_image'         : <PIL.Image>,
        'image_tensor'      : <torch.Tensor>
    }
    """
    try:
        model, device = get_model(model_path)

        # Load original PIL image (needed for GradCAM overlay)
        pil_image    = Image.open(image_path).convert('RGB')
        image_tensor = transform(pil_image).unsqueeze(0)   # (1, 3, 224, 224)

        with torch.no_grad():
            logits        = model(image_tensor.to(device))      # (1, 2) CORAL logits
            class_probs   = coral_logits_to_class_probs(logits) # (1, 3) class probs
            predicted_idx = probas_to_labels(logits).item()     # scalar class index

        # Confidence = probability of predicted class
        probs_np        = class_probs[0].cpu().numpy()
        confidence      = float(probs_np[predicted_idx]) * 100
        predicted_class = CLASSES[predicted_idx]

        # All class probabilities as dict
        all_probs = {
            CLASSES[i]: round(float(probs_np[i]) * 100, 2)
            for i in range(len(CLASSES))
        }

        above_threshold = (confidence / 100) >= CONFIDENCE_THRESHOLD

        return {
            'success'          : True,
            'predicted_class'  : predicted_class,
            'predicted_idx'    : predicted_idx,
            'confidence'       : round(confidence, 2),
            'all_probabilities': all_probs,
            'above_threshold'  : above_threshold,
            'message'          : (
                'Classification successful'
                if above_threshold
                else 'Low confidence. Please upload a clearer X-ray image.'
            ),
            'pil_image'    : pil_image,
            'image_tensor' : image_tensor,
        }

    except Exception as e:
        return {
            'success': False,
            'message': f'Classification failed: {str(e)}'
        }
