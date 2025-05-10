# UAV Detection

A deep learning-based system for detecting and classifying Unmanned Aerial Vehicles (UAVs) or drones in various environments.

![UAV Detection](https://github.com/mdhaarishussain/uav-detection/raw/main/assets/drone-detection-example.png)

## 📋 Overview

This repository contains a complete pipeline for detecting UAVs/drones using computer vision and deep learning techniques. The system is designed to work with different input sources including images, videos, and real-time camera feeds.

### Key Features

- **Multi-model Support**: Implements YOLOv5, YOLOv7, and YOLOv8 architectures
- **Custom Dataset**: Trained on a curated dataset of drone images across various environments
- **Real-time Detection**: Optimized for real-time inference on various hardware platforms
- **Multiple Detection Classes**: Can distinguish between different types of drones/UAVs
- **Performance Metrics**: Includes evaluation scripts to measure accuracy, precision, recall, and F1 score

## 🛠️ Installation

### Prerequisites

- Python 3.8 or higher
- CUDA-capable GPU (recommended for training)
- Git

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/mdhaarishussain/uav-detection.git
   cd uav-detection
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## 📊 Dataset

The model is trained on a custom dataset containing various UAV images collected from different sources and environments. The dataset includes:

- Multiple drone types and models
- Various lighting conditions
- Different backgrounds (urban, natural, sky)
- Different distances and angles

### Dataset Structure

```
dataset/
├── train/
│   ├── images/
│   └── labels/
├── val/
│   ├── images/
│   └── labels/
└── test/
    ├── images/
    └── labels/
```

## 🚀 Usage

### Training

To train a model on your dataset:

```bash
python train.py --model yolov8 --data data.yaml --epochs 100 --batch-size 16
```

### Inference

For inference on images:

```bash
python detect.py --source samples/image.jpg --weights weights/best.pt
```

For inference on videos:

```bash
python detect.py --source samples/video.mp4 --weights weights/best.pt
```

For real-time webcam detection:

```bash
python detect.py --source 0 --weights weights/best.pt
```

## 📈 Performance

| Model | mAP@0.5 | Precision | Recall | F1 Score | FPS (RTX 3090) |
|-------|---------|-----------|--------|----------|---------------|
| YOLOv5s | 0.87 | 0.86 | 0.89 | 0.87 | 55 |
| YOLOv7 | 0.91 | 0.92 | 0.89 | 0.90 | 45 |
| YOLOv8n | 0.89 | 0.90 | 0.88 | 0.89 | 60 |

## 🧪 Experiments

The repository contains various experimental models and techniques:

- Data augmentation techniques specifically designed for UAV detection
- Transfer learning from pre-trained models
- Ensemble methods for improved accuracy
- Model quantization for deployment on edge devices

## 📱 Deployment

Instructions for deploying the model on different platforms:

### Desktop Application

Installation and usage instructions for the desktop application.

### Mobile Application

Steps to integrate the model into a mobile application.

### Edge Devices

Guidelines for deploying on edge devices like Jetson Nano, Raspberry Pi, etc.

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgements

- [Ultralytics YOLO](https://github.com/ultralytics/yolov5)
- [WongKinYiu/yolov7](https://github.com/WongKinYiu/yolov7)
- [Roboflow](https://roboflow.com/) for dataset tooling
- All contributors who have helped with data collection and annotation

## 📞 Contact

Idries Ahamed KA (https://github.com/mdhaarishussain)

Project Link: [https://github.com/mdhaarishussain/uav-detection](https://github.com/mdhaarishussain/uav-detection)
