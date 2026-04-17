import numpy as np
import torch
import torch.nn as nn
import cv2
from PIL import Image
from pytorch_grad_cam import GradCAMPlusPlus
from pytorch_grad_cam.utils.image import show_cam_on_image
from pytorch_grad_cam.utils.model_targets import ClassifierOutputTarget
import base64
import io

from model.model_def import CLASSES, coral_logits_to_class_probs


class SwinReshapeTransform:
    """
    Converts Swin block output (B, H, W, C) → (B, C, H, W) for GradCAM.
    Also handles (B, N, C) fallback.
    """
    def __call__(self, tensor):
        if isinstance(tensor, (tuple, list)):
            tensor = tensor[0]
        if tensor.ndim == 4:
            B, H, W, C = tensor.shape
            return tensor.permute(0, 3, 1, 2).contiguous()
        if tensor.ndim == 3:
            B, N, C = tensor.shape
            H = W = int(N ** 0.5)
            return tensor.reshape(B, H, W, C).permute(0, 3, 1, 2).contiguous()
        raise ValueError(f"Unexpected tensor shape: {tensor.shape}")


class SwinOrdinalGradCAMWrapper(nn.Module):
    """
    Wraps SwinOrdinal to produce (B, K) class probabilities
    that ClassifierOutputTarget can index into.
    """
    def __init__(self, model, num_classes=3):
        super().__init__()
        self.model = model
        self.num_classes = num_classes

    def forward(self, x):
        logits = self.model(x)                        # (B, K-1)
        cum_probs = torch.sigmoid(logits)             # (B, K-1)
        B = cum_probs.shape[0]
        ones = torch.ones(B, 1, device=cum_probs.device)
        zeros = torch.zeros(B, 1, device=cum_probs.device)
        chain = torch.cat([ones, cum_probs, zeros], dim=1)  # (B, K+1)
        class_probs = chain[:, :-1] - chain[:, 1:]         # (B, K)
        return class_probs


def generate_gradcam_heatmap(model, image_tensor, pil_image, predicted_class_idx, device):
    """
    Generate a GradCAM++ heatmap for the predicted class.
    
    Args:
        model: SwinOrdinal model (already loaded, eval mode)
        image_tensor: preprocessed tensor (1, 3, 224, 224)
        pil_image: original PIL image (for overlay)
        predicted_class_idx: int, index of predicted class
        device: torch.device

    Returns:
        base64-encoded PNG string of the heatmap overlay
    """
    wrapped_model = SwinOrdinalGradCAMWrapper(model, num_classes=len(CLASSES))
    wrapped_model.to(device)
    wrapped_model.eval()

    # Target the last Swin stage's last block
    target_layer = [model.swin.layers[-1].blocks[-1].norm1]

    cam = GradCAMPlusPlus(
        model=wrapped_model,
        target_layers=target_layer,
        reshape_transform=SwinReshapeTransform(),
    )

    targets = [ClassifierOutputTarget(predicted_class_idx)]
    grayscale_cam = cam(
        input_tensor=image_tensor.to(device),
        targets=targets,
        aug_smooth=True,
        eigen_smooth=False,
    )
    grayscale_cam = grayscale_cam[0]  # (H, W)

    # Prepare RGB image for overlay
    img_resized = pil_image.resize((224, 224)).convert("RGB")
    img_np = np.array(img_resized, dtype=np.float32) / 255.0

    # Overlay heatmap
    cam_image = show_cam_on_image(img_np, grayscale_cam, use_rgb=True)

    # Encode to base64 PNG
    cam_pil = Image.fromarray(cam_image)
    buffer = io.BytesIO()
    cam_pil.save(buffer, format="PNG")
    buffer.seek(0)
    encoded = base64.b64encode(buffer.read()).decode("utf-8")
    return f"data:image/png;base64,{encoded}"


def image_to_base64(pil_image):
    """Convert PIL image to base64 PNG for display."""
    buffer = io.BytesIO()
    pil_image.resize((224, 224)).convert("RGB").save(buffer, format="PNG")
    buffer.seek(0)
    encoded = base64.b64encode(buffer.read()).decode("utf-8")
    return f"data:image/png;base64,{encoded}"
