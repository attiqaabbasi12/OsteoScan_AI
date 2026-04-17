import os
import uuid
from PIL import Image

# ── Import YOUR GradCAM utility ───────────────────────────────
from model.cam_utils import generate_gradcam_heatmap, image_to_base64
from model.model_def import CLASSES


# ─────────────────────────────────────────────────────────────
# GENERATE GRADCAM++ HEATMAP
# ─────────────────────────────────────────────────────────────
def generate_heatmap(
    model,
    image_tensor,
    pil_image,
    predicted_idx : int,
    heatmap_dir   : str,
    device,
) -> dict:
    """
    Generate GradCAM++ heatmap using YOUR cam_utils.py implementation.

    Args:
        model         : loaded SwinOrdinal model
        image_tensor  : preprocessed tensor (1, 3, 224, 224) from classifier
        pil_image     : original PIL image from classifier
        predicted_idx : predicted class index (0/1/2)
        heatmap_dir   : directory to save overlay PNG
        device        : torch.device

    Returns:
    {
        'success'      : True/False,
        'overlay_name' : 'abc123_gradcam.png',
        'base64'       : 'data:image/png;base64,...',
        'message'      : '...'
    }
    """
    try:
        os.makedirs(heatmap_dir, exist_ok=True)

        # ── Call YOUR generate_gradcam_heatmap() ──────────────
        # Returns a base64-encoded PNG string
        base64_str = generate_gradcam_heatmap(
            model               = model,
            image_tensor        = image_tensor,
            pil_image           = pil_image,
            predicted_class_idx = predicted_idx,
            device              = device,
        )

        # ── Also save as a PNG file for PDF report ─────────────
        # Decode base64 → PIL → save to disk
        import base64, io
        header, encoded = base64_str.split(',', 1)
        img_bytes       = base64.b64decode(encoded)
        overlay_img     = Image.open(io.BytesIO(img_bytes))

        overlay_name    = f"{uuid.uuid4().hex}_gradcam.png"
        overlay_path    = os.path.join(heatmap_dir, overlay_name)
        overlay_img.save(overlay_path)

        return {
            'success'     : True,
            'overlay_name': overlay_name,
            'overlay_path': overlay_path,
            'base64'      : base64_str,
            'message'     : 'GradCAM++ heatmap generated successfully',
        }

    except Exception as e:
        return {
            'success': False,
            'message': f'Heatmap generation failed: {str(e)}'
        }


def get_original_base64(pil_image) -> str:
    """Convert original PIL image to base64 for frontend display."""
    return image_to_base64(pil_image)
