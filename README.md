# TILI HUB

A full-stack web application for managing Tunisian associations with AI-powered document verification, role-based dashboards, and intelligent administrative tools.

## Contents
- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Usage](#usage)
- [AI Features](#ai-features)
- [Role-Based Access](#role-based-access)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)
- [License](#license)

## Overview

EspritMaratech2026-PIP is a comprehensive platform designed to streamline the management of Tunisian associations. The application provides automated document verification using AI, customizable role-based dashboards, and intelligent administrative tools to improve efficiency and reduce manual processing.

## Features

### Core Features
- **AI-Powered Document Verification**: Automated validation and verification of association documents
- **Role-Based Dashboards**: Customized interfaces for different user roles (Admin, Manager, Member)
- **Association Management**: Complete CRUD operations for association data
- **User Management**: Member registration, authentication, and profile management
- **Document Management**: Upload, store, and organize association documents
- **Intelligent Administrative Tools**: AI-assisted decision-making and automation

### Additional Features
- Real-time notifications
- Advanced search and filtering
- Data analytics and reporting
- Secure authentication and authorization
- Responsive design for mobile and desktop

## Tech Stack

### Frontend
- **Framework**: React
- **UI Library**: Material-UI
- **HTTP Client**: Axios
- **Build Tool**: Vite

### Backend
- **Framework**: Python (Django)
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **AI/ML**: TensorFlow/PyTorch
- **OCR**: Tesseract

## Project Structure

```
EspritMaratech2026-pip/
├── backend/
│   ├── api/
│   ├── auth/
│   ├── chatbot/
│   ├── finances/
│   ├── meetings/
│   ├── notifications/
│   ├── users/
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## Getting Started

### Prerequisites

Before running this project, make sure you have the following installed:

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **Python** (v3.8 or higher) - [Download](https://www.python.org/)
- **PostgreSQL** - Database system
- **npm** or **yarn** - Package manager
- **Git** - Version control

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/HamdiBelhaj0013/EspritMaratech2026-pip.git
cd EspritMaratech2026-pip
```

2. **Backend Setup**

```bash
cd backend
pip install -r requirements.txt
```

3. **Frontend Setup**

```bash
cd ../frontend
npm install
```

### Environment Variables

Create `.env` files in both backend and frontend directories:

**Backend `.env`:**

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
DB_CONNECTION_STRING=postgresql://user:password@localhost:5432/espritmaratech

# JWT Authentication
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d

# AI/ML Services
AI_MODEL_PATH=./models/document_verifier.h5
OCR_API_KEY=your_ocr_api_key

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# Email Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_password
```

**Frontend `.env`:**

```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=EspritMaratech2026
```

## Usage

### Running the Application

**Development Mode:**

1. Start the backend server:

```bash
cd backend
python manage.py runserver
```

2. Start the frontend development server:

```bash
cd frontend
npm run dev
```

3. Access the application:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000

**Production Mode:**

```bash
# Build frontend
cd frontend
npm run build

# Start backend in production
cd ../backend
python manage.py runserver --settings=production
```

## AI Features

### Document Verification System

The AI-powered document verification system includes:

#### Optical Character Recognition (OCR)
- Extracts text from uploaded documents
- Supports multiple document formats (PDF, JPG, PNG)

#### Document Classification
- Automatically categorizes documents by type
- Validates document authenticity

#### Data Extraction
- Extracts key information (dates, names, IDs)
- Validates extracted data against predefined rules

#### Fraud Detection
- Detects anomalies and potential fraudulent documents
- Flags suspicious submissions for manual review

### Training the AI Model

```bash
cd backend/services/ai
python train_model.py --dataset ./data/training --epochs 50
```

## Role-Based Access

The application supports three main user roles:

- **Admin**: Full system access and configuration
- **Manager**: Association management and reporting
- **Member**: Basic access to personal information and documents

## API Documentation

API documentation is available at `/api/docs` when running the backend server.

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details

## Authors
**team PIP**:
- **Hamdi Belhaj** - [@HamdiBelhaj0013](https://github.com/HamdiBelhaj0013)
- **Youcef Chalbi** - [@Youcef3939](https://github.com/Youcef3939)

---

**Note:** This project was developed as part of the ESPRIT Maratech 2026 hackathon
#MaraTechEsprit2026
