# 🦴 OsteoScan AI — Knee X-Ray Bone Density Analysis System

Final Year Project | React + Flask | Swin Transformer + GradCAM++

---

## 📁 Project Structure

```
osteoporosis_fyp/
├── backend/     ← Flask API + ML Model
└── frontend/    ← React Web App
```

---

## ⚙️ Backend Setup

```bash
cd backend

# 1. Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Add your trained model
# Place your swin_transformer.pth file in:
mkdir -p model
cp /path/to/your/swin_transformer.pth model/

# 4. Run Flask server
python app.py
# Server runs on http://localhost:5000
```

---

## 🎨 Frontend Setup

```bash
cd frontend

# 1. Install packages
npm install

# 2. Start React app
npm start
# App runs on http://localhost:3000
```

---

## 🔄 System Flow

```
1. Doctor registers with Lab ID, Name, Email
2. Uploads knee X-ray image
3. Swin Transformer classifies → Normal / Osteopenia / Osteoporosis
4. If confidence < 80% → asks for clearer image
5. GradCAM++ heatmap generated and displayed
6. Doctor enters patient info (name, age, gender)
7. Clinical question engine runs (class-specific questions)
8. Score calculated → Confirmed or DEXA Recommended
9. First aid / recommendations displayed
10. PDF report generated and saved to history
```

---

## 🗂️ API Endpoints

| Method | Endpoint                    | Description              |
|--------|-----------------------------|--------------------------|
| POST   | /api/auth/register          | Register doctor          |
| POST   | /api/auth/login             | Login                    |
| GET    | /api/auth/profile           | Get profile              |
| PUT    | /api/auth/password          | Change password          |
| POST   | /api/scan/classify          | Classify X-ray           |
| GET    | /api/scan/questions/<class> | Get questions for class  |
| POST   | /api/scan/submit            | Submit session           |
| GET    | /api/history/               | All sessions             |
| GET    | /api/history/<id>           | Single session           |
| GET    | /api/history/<id>/pdf       | Download PDF report      |
| DELETE | /api/history/<id>           | Delete session           |

---

## 🧠 Model

- Architecture : Swin Transformer (swin_base_patch4_window7_224)
- Classes      : Normal, Osteopenia, Osteoporosis
- Accuracy     : 90.78%
- Explainability: GradCAM++ heatmap

Place your trained model at: `backend/model/swin_transformer.pth`

---

## 📋 Question Engine

- Normal       : 5 questions, threshold ≥ 4/8
- Osteopenia   : 7 questions, threshold ≥ 6/12
- Osteoporosis : 8 questions, threshold ≥ 10/18

---

## ⚠️ Disclaimer

This system is a clinical decision support tool only.
It does not constitute a formal medical diagnosis.
Always consult a qualified physician.
