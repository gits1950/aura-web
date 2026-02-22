-- ============================================================
-- AURA DENTAL CLINIC — Database Schema
-- Run once: mysql -u root -p < database.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS aura_dental CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE aura_dental;

-- ── Patients ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS patients (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  name           VARCHAR(150) NOT NULL,
  age            INT,
  gender         ENUM('Male','Female','Other') DEFAULT 'Male',
  contact        VARCHAR(20),
  email          VARCHAR(150),
  address        TEXT,
  medicalHistory JSON,
  createdAt      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Doctors ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS doctors (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  name      VARCHAR(150) NOT NULL,
  specialty VARCHAR(150) DEFAULT 'Dental Surgeon',
  contact   VARCHAR(20),
  email     VARCHAR(150),
  password  VARCHAR(100),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Treatments (master list) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS treatments (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(150) NOT NULL,
  cost        DECIMAL(10,2) DEFAULT 0,
  description TEXT
);

-- ── Medicines (master list) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS medicines (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  name      VARCHAR(150) NOT NULL,
  dosage    VARCHAR(100),
  frequency VARCHAR(100),
  duration  VARCHAR(100)
);

-- ── Chairs ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chairs (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  status      ENUM('available','occupied','cleaning') DEFAULT 'available',
  patientName VARCHAR(150),
  startTime   DATETIME
);

-- ── Doctor Queue ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS doctor_queue (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  patientId       INT NOT NULL,
  time            VARCHAR(10),
  consultationFee DECIMAL(10,2) DEFAULT 0,
  status          ENUM('waiting','with-doctor','completed','cancelled') DEFAULT 'waiting',
  createdAt       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patientId) REFERENCES patients(id)
);

-- ── Visits (core clinical record) ───────────────────────────
CREATE TABLE IF NOT EXISTS visits (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  patientId           INT NOT NULL,
  doctorId            INT NOT NULL,
  visitDate           DATE NOT NULL,
  chiefComplaint      VARCHAR(250),
  diagnosis           TEXT,
  labTests            JSON,
  teeth               JSON,
  notes               TEXT,
  procedureDone       TEXT,
  totalCost           DECIMAL(10,2) DEFAULT 0,
  amountPaid          DECIMAL(10,2) DEFAULT 0,
  paymentMethod       VARCHAR(50),
  discount            DECIMAL(10,2) DEFAULT 0,
  discountReason      VARCHAR(250),
  finalAmount         DECIMAL(10,2),
  chairAssigned       INT,
  status              ENUM('pending','in-treatment','completed','cancelled') DEFAULT 'pending',
  paymentStatus       ENUM('pending','paid') DEFAULT 'pending',
  prescriptionReady   TINYINT(1) DEFAULT 0,
  prescriptionPrinted TINYINT(1) DEFAULT 0,
  opdReviewedAt       DATETIME,
  rxPrintedAt         DATETIME,
  completedAt         DATETIME,
  createdAt           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patientId) REFERENCES patients(id),
  FOREIGN KEY (doctorId)  REFERENCES doctors(id)
);

-- ── Visit Treatments ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS visit_treatments (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  visitId       INT NOT NULL,
  treatmentId   INT,
  treatmentName VARCHAR(150),
  cost          DECIMAL(10,2),
  FOREIGN KEY (visitId) REFERENCES visits(id) ON DELETE CASCADE
);

-- ── Visit Medicines ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS visit_medicines (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  visitId      INT NOT NULL,
  medicineId   INT,
  medicineName VARCHAR(150),
  dosage       VARCHAR(100),
  frequency    VARCHAR(100),
  duration     VARCHAR(100),
  FOREIGN KEY (visitId) REFERENCES visits(id) ON DELETE CASCADE
);

-- ── Users (login) ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  username  VARCHAR(100) NOT NULL UNIQUE,
  password  VARCHAR(100) NOT NULL,
  name      VARCHAR(150),
  role      ENUM('admin','doctor','receptionist') DEFAULT 'receptionist',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Indexes ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_visits_patient   ON visits(patientId);
CREATE INDEX IF NOT EXISTS idx_visits_doctor    ON visits(doctorId);
CREATE INDEX IF NOT EXISTS idx_visits_date      ON visits(visitDate);
CREATE INDEX IF NOT EXISTS idx_visits_status    ON visits(status);
CREATE INDEX IF NOT EXISTS idx_queue_patient    ON doctor_queue(patientId);

-- ── Seed Data ────────────────────────────────────────────────
INSERT IGNORE INTO doctors (id,name,specialty,email) VALUES
  (1,'Dr. Sahil Chawla','Dental Surgeon','sahil@auradental.com');

INSERT IGNORE INTO treatments (id,name,cost) VALUES
  (1,'Consultation',500),(2,'Scaling & Polishing',1500),
  (3,'Root Canal Treatment',3000),(4,'PFM Crown',5000),
  (5,'Extraction',1000),(6,'Composite Filling',800),
  (7,'Teeth Whitening',8000),(8,'Braces (Full)',50000),
  (9,'Denture (Full)',15000),(10,'Implant',25000);

INSERT IGNORE INTO medicines (id,name,dosage,frequency,duration) VALUES
  (1,'Amoxicillin 500mg','1 tablet','3 times/day','5 days'),
  (2,'Ibuprofen 400mg','1 tablet','3 times/day','3 days'),
  (3,'Metronidazole 400mg','1 tablet','3 times/day','5 days'),
  (4,'Paracetamol 500mg','1-2 tablets','As needed','3 days'),
  (5,'Chlorhexidine Mouthwash','10ml rinse','Twice daily','7 days'),
  (6,'Vitamin C 500mg','1 tablet','Once daily','10 days');

INSERT IGNORE INTO chairs (id) VALUES (1),(2),(3),(4),(5),(6);

INSERT IGNORE INTO users (id,username,password,name,role) VALUES
  (1,'admin','admin123','Admin User','admin'),
  (2,'doctor1','doctor123','Dr. Sahil Chawla','doctor'),
  (3,'reception','reception123','Reception Staff','receptionist');
