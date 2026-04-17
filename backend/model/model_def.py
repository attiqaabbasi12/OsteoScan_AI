import torch
import torch.nn as nn
import timm

CLASSES = ["Normal", "Osteopenia", "Osteoporosis"]
CLASS_TO_IDX = {cls: i for i, cls in enumerate(CLASSES)}
IMG_SIZE = 224


class CORALoss(nn.Module):
    def forward(self, logits, target):
        levels = torch.arange(logits.size(1)).to(logits.device)
        target_binary = (target.view(-1, 1) > levels).float()
        loss = -(
            nn.functional.logsigmoid(logits) * target_binary
            + (nn.functional.logsigmoid(logits) - logits) * (1 - target_binary)
        )
        return loss.mean()


def probas_to_labels(logits):
    return torch.sum(torch.sigmoid(logits) > 0.5, dim=1)


def coral_logits_to_class_probs(logits):
    """
    Convert CORAL ordinal logits (B, K-1) to class probabilities (B, K).
    P(Normal)      = 1 - sigmoid(logits[0])
    P(Osteopenia)  = sigmoid(logits[0]) - sigmoid(logits[1])
    P(Osteoporosis)= sigmoid(logits[1])
    """
    cum_probs = torch.sigmoid(logits)  # (B, K-1)
    B = cum_probs.shape[0]
    ones = torch.ones(B, 1, device=cum_probs.device)
    zeros = torch.zeros(B, 1, device=cum_probs.device)
    chain = torch.cat([ones, cum_probs, zeros], dim=1)  # (B, K+1)
    class_probs = chain[:, :-1] - chain[:, 1:]          # (B, K)
    return class_probs


class SwinOrdinal(nn.Module):
    def __init__(self, num_classes=3):
        super().__init__()
        self.swin = timm.create_model(
            "swin_tiny_patch4_window7_224", pretrained=False
        )
        in_features = self.swin.head.fc.in_features
        self.swin.head.fc = nn.Linear(in_features, num_classes - 1)

    def forward(self, x):
        return self.swin(x)


def load_model(weights_path: str, device: torch.device) -> SwinOrdinal:
    model = SwinOrdinal(num_classes=len(CLASSES))
    state_dict = torch.load(weights_path, map_location=device)
    model.load_state_dict(state_dict)
    model.to(device)
    model.eval()
    return model
