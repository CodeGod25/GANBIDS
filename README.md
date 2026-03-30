# GANBIDS — GAN-Based Intrusion Detection System Dashboard

> **Cyber attack simulation powered by Generative Adversarial Networks to strengthen IDS detection**
> 
> A full-stack web application demonstrating how GANs generate synthetic network traffic to train and validate Intrusion Detection Systems. Built for Computer Networks education.

## 🎯 Project Overview

GANBIDS combines **machine learning** with **cybersecurity** to create a command-center dashboard that:

1. **Generates realistic cyber attacks** using a GAN (Generative Adversarial Network)
2. **Classifies traffic** using an IDS (Random Forest classifier trained on NSL-KDD)
3. **Visualizes the adversarial loop** in real-time with a cyberpunk-themed dashboard
4. **Demonstrates CN concepts**: OSI layers, TCP/UDP/ICMP protocols, firewalls, packet capture, network topology

---

## 🏗️ Architecture

```
GANBIDS Project/
├── ganbids-frontend/          # React + Vite dashboard
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/        # Sidebar, TopBar, MainLayout
│   │   │   ├── widgets/       # MetricCard, GlassPanel
│   │   │   └── charts/        # Chart.js visualizations
│   │   ├── pages/             # 5 dashboard pages
│   │   ├── data/              # Mock data (mockData.js)
│   │   ├── styles/            # Design system CSS
│   │   └── main.jsx
│   ├── package.json           # React, Router, Chart.js
│   └── index.html
│
└── ganbids-backend/           # Python Flask + PyTorch
    ├── app.py                 # Flask + SocketIO API
    ├── models/
    │   ├── generator.py       # GAN Generator (PyTorch)
    │   ├── discriminator.py   # GAN Discriminator (PyTorch)
    │   └── ids_classifier.py  # IDS (scikit-learn Random Forest)
    ├── data/
    │   └── preprocess.py      # NSL-KDD preprocessing
    ├── training/
    │   ├── train_gan.py       # GAN training loop
    │   └── train_ids.py       # IDS training
    ├── requirements.txt
    └── README.md
```

---

## 🚀 Quick Start

### Frontend Only (Fast Setup)
```bash
cd ganbids
npm install
npm run dev
```
Open http://localhost:5173 — Uses mock data, no ML backend needed.

### Full Stack (With Backend)
#### 1. Install Backend Dependencies
```bash
cd ganbids-backend
pip install -r requirements.txt
```

#### 2. Start Flask Backend
```bash
python app.py
```
Server runs on http://localhost:5000

#### 3. (In another terminal) Start Frontend
```bash
cd ../ganbids
npm run dev
```

Frontend connects to backend via WebSocket and REST APIs.

---

## 📊 Dashboard Pages

| Page | Purpose | Key Features |
|------|---------|--------------|
| **Live Dashboard** | Real-time simulation overview | Metric cards, attack flow graph, event log |
| **GAN Training** | Monitor model training | Loss curves, hyper-parameters, synthetic sample preview |
| **IDS Analytics** | Classifier performance | Confusion matrix, metrics, confidence distribution |
| **Attack Visualization** | Deep-dive packet analysis | OSI layer inspector, t-SNE clustering, feature importance |
| **Simulation Logs** | System console | Terminal log viewer, packet capture table, firewall rules |

---

## 🎨 Design System: "The Cybernetic Sentinel"

- **Colors**: Midnight void (#0B0E14), Cyan primary (#69DAFF), Neon green (#2FF801), Crimson red (#FF7073)
- **Typography**: Space Grotesk (headlines), Inter (body), JetBrains Mono (data)
- **Aesthetic**: Glassmorphism, scanline overlays, ambient glows, tonal surfaces
- **Responsive**: Works on 1920px, 1440px, 1024px, and mobile

---

## 🔧 API Endpoints

### REST API

```
GET  /api/status              # System status
GET  /api/metrics             # Current GAN/IDS metrics
GET  /api/packets             # Latest synthetic packets
POST /api/train/start         # Start GAN training
POST /api/train/stop          # Stop training
POST /api/classification      # Classify a packet
GET  /api/logs                # Simulation logs
```

### WebSocket Events

```javascript
emit('training_started')      // Backend → Frontend: Training initiated
emit('training_progress')     // Backend → Frontend: Epoch metrics
emit('classification_result') // Backend → Frontend: IDS classification
emit('packet_generated')      // Backend → Frontend: New synthetic packet
emit('request_update')        // Frontend → Backend: Request metrics
```

---

## 🧠 Machine Learning Models

### GAN Architecture
- **Generator**: Noise (100-dim) → Synthetic packets (41-dim NSL-KDD features)
  - 3 FC layers + BatchNorm + ReLU + Tanh output
- **Discriminator**: Packet features (41-dim) → Real vs Fake probability
  - 3 FC layers + LeakyReLU + Sigmoid output
- **Training**: Adversarial loss, Adam optimizers, Nash equilibrium

### IDS Classifier
- **Algorithm**: Random Forest (100 trees, max_depth=15)
- **Input**: 41-dimensional network packet features (NSL-KDD schema)
- **Output**: Classification (NORMAL | DDOS | PROBE | R2L | U2R) + confidence
- **Dataset**: Trained on NSL-KDD (10,000 samples) or synthetic data

### Data Format
NSL-KDD 41 features:
```
[duration, protocol_type, service, flag, src_bytes, dst_bytes, land, 
 wrong_fragment, urgent, hot, num_failed_logins, logged_in, 
 num_compromised, root_shell, su_attempted, num_root, num_file_creations,
 num_shells, num_access_files, num_outbound_cmds, is_host_login,
 is_guest_login, count, srv_count, serror_rate, srv_serror_rate,
 rerror_rate, srv_rerror_rate, same_srv_rate, diff_srv_rate,
 srv_diff_host_rate, dst_host_count, dst_host_srv_count,
 dst_host_same_srv_rate, dst_host_diff_srv_rate,
 dst_host_same_src_port_rate, dst_host_srv_diff_host_rate,
 dst_host_serror_rate, dst_host_srv_serror_rate, dst_host_rerror_rate,
 dst_host_srv_rerror_rate]
```

---

## 📡 Real-Time Features

- **Live Training Metrics**: GAN epoch progress, loss curves, inception score
- **Packet Stream**: Real-time synthetic packet generation
- **IDS Alerts**: Incoming classification results with confidence scores
- **Event Log**: Timestamped attack detection events
- **System Throughput**: EPS (events per second) counter

---

## 💻 Tech Stack

### Frontend
- **Vite** — Lightning-fast build tool
- **React 19** — UI framework
- **React Router** — SPA navigation
- **Chart.js** — Data visualizations (line, bar, radar, histogram)
- **Socket.IO** — WebSocket for real-time updates
- **Vanilla CSS** — Custom design system (no Tailwind)

### Backend
- **Flask** — Lightweight Python web server
- **Flask-SocketIO** — WebSocket support
- **PyTorch** — GAN models
- **scikit-learn** — IDS classifier
- **pandas/numpy** — Data manipulation

### Deployment
- **Frontend**: Vercel, Netlify (static hosting)
- **Backend**: Railway, Render, Heroku (Python + PyTorch)
- **Database**: Optional (checkpoint storage for models)

---

## 📚 Computer Networks Concepts Demonstrated

### Core CN Topics
1. **OSI Model** - 7-layer packet inspection
2. **TCP/UDP/ICMP Protocols** - Real packet header analysis
3. **Network Topology** - Force-directed graph visualization
4. **Firewalls & ACLs** - iptables-style rule configuration
5. **Packet Capture** - Wireshark-style deep packet inspection
6. **Protocol Analysis** - TCP flags, ICMP echo, UDP payload
7. **Network Performance** - Latency, throughput, jitter metrics
8. **Intrusion Detection** - Signature-based and anomaly detection

### How GANs Strengthen IDS
The adversarial loop mirrors real attacker-vs-defender dynamics:
- **Generator** = Attacker trying to craft evasive attack patterns
- **Discriminator** = Defender learning to identify attacks
- **IDS Classifier** = Real-world detection system being strengthened
- **Result** = More robust IDS that catches novel attack variants

---

## 📖 Usage / Mini Project Submission

### For Student Submission:
1. **Report**: Add a `REPORT.md` documenting:
   - GAN architecture & training process
   - NSL-KDD dataset summary
   - IDS classifier performance metrics
   - CN concepts implemented

2. **Screenshots**: Capture dashboard pages for documentation

3. **Video**: Screen recording of live simulation (optional but impressive)

### Running a Demo:
```bash
# Terminal 1 - Backend
cd ganbids-backend
python app.py

# Terminal 2 - Frontend
cd ganbids
npm run dev

# Open browser to http://localhost:5173
# Click "START_SIMULATION" in sidebar
# Watch GAN training and IDS classifications in real-time
```

---

## 🔮 Future Enhancements

- [ ] Real network packet capture integration (scapy)
- [ ] Advanced GAN variants (WGAN, StyleGAN)
- [ ] Distributed training across multiple GPUs
- [ ] REST API authentication (JWT)
- [ ] Database backend (PostgreSQL) for long-term metrics
- [ ] Docker containerization
- [ ] Kubernetes deployment manifests
- [ ] 3D network topology visualization
- [ ] Multi-tenant support

---

## 📄 License

Educational project for Computer Networks course.

---

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the project
2. Create a feature branch
3. Submit a pull request

---

## 📧 Support

For issues or questions:
- Check `GANBIDS/DESIGN.md` for architecture details
- Review comments in `src/components` and `models/`
- Create a GitHub Issue

---

## 🎓 Educational Value

This project teaches:
- **ML/AI**: GANs, adversarial training, PyTorch, scikit-learn
- **Cybersecurity**: IDS fundamentals, NSL-KDD dataset, attack vectors
- **Computer Networks**: OSI model, TCP/UDP/ICMP, packet analysis
- **Full-Stack Web**: React, Flask, REST APIs, WebSockets, CSS design
- **DevOps**: Docker, Docker Compose, deployment strategies

Perfect for a **Computer Networks mini project** that demonstrates real-world application of CN concepts!

---

**Made with ❤️ for cybersecurity education**
