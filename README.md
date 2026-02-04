# Thynk Compliance Platform (TCP)

**Regulatory intelligence infrastructure for regulated and emerging wellness markets.**

Thynk Compliance Platform (TCP) is a proprietary regulatory intelligence system designed to support regulated businesses in monitoring, understanding, and responding to evolving legal and regulatory frameworks across cannabis, hemp, kratom, nicotine/vapes, psychedelics, and adjacent wellness categories.

TCP continuously monitors regulatory activity across all 50 U.S. states, Washington D.C., and relevant federal agencies. The platform consolidates fragmented regulatory activity into structured, operationally relevant intelligence intended to support compliance, legal review, and internal decision-making.

🌐 **Live Platform:** https://www.thynkflow.io

---

## Platform Purpose

TCP is designed for **legal, compliance, regulatory affairs, and operations teams** operating in industries characterized by complex, rapidly changing regulatory environments.

The platform is intended to:
- Improve regulatory visibility across jurisdictions
- Support internal compliance workflows
- Reduce reliance on ad hoc regulatory research
- Assist organizations in maintaining situational awareness of regulatory activity

TCP is not a substitute for legal advice and does not provide legal opinions or regulatory approvals.

---

## Core Capabilities

- **Regulatory Monitoring**  
  Ongoing tracking of state and federal regulatory activity

- **Automated Source Aggregation**  
  Structured ingestion from public regulatory sources, including:
  - Federal Register  
  - Regulations.gov  
  - State legislatures and regulatory agencies

- **Document Processing**  
  Automated normalization and categorization of regulatory instruments

- **Alerts & Notifications**  
  Configurable notifications based on jurisdiction, product category, and regulatory activity

- **Compliance Workflows**  
  Tools to support internal tracking, review, and operational alignment

- **Public Comment Awareness**  
  Monitoring and participation support for rulemaking processes

---

## Repository Scope & Architecture

This repository contains the **application interface and orchestration layer** of the Thynk Compliance Platform.

### Included Components (Open-Core)

- Frontend application logic and UI components  
- Client-side state management and routing  
- Authentication hooks and access control integration  
- Non-sensitive workflow orchestration

### Excluded Components (Closed-Core / Proprietary)

The following systems are intentionally excluded and maintained as proprietary services:
- Regulatory ingestion and validation pipelines  
- Jurisdictional normalization and mapping logic  
- Classification, tagging, and enrichment models  
- Compliance interpretation frameworks  
- Risk scoring, alert prioritization, and decision logic  
- Internal data enrichment, verification, and quality controls  

This architectural separation is intended to preserve data integrity, platform reliability, and regulatory defensibility.

---

## Technology Overview

TCP is implemented using a modern SaaS architecture designed to support scalability, availability, and operational security.

### Stack

- **Frontend**: React 18 · TypeScript · Vite · Tailwind CSS · shadcn/ui  
- **Backend**: Supabase (PostgreSQL · Auth · Edge Functions)  
- **Hosting & Infrastructure**: Vercel  
- **CI/CD**: GitHub Actions  

---

## Local Development

### Prerequisites
- Node.js 18+
- npm

### Setup

```bash
npm install
cp .env.example .env.local
npm run dev
