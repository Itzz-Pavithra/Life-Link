# LifeLink – Smart Blood Donation & Emergency Matching System

## Project Description

LifeLink is a SvelteKit-based smart blood donation and emergency matching platform designed to connect blood recipients directly with compatible donors in real-time. By leveraging Firebase and Firestore, the system automates donor eligibility checks, processes blood requests, and triggers immediate donor notifications via Gmail SMTP using Nodemailer. With dedicated dashboards for donors, recipients, and administrators, the system coordinates emergency matching requests while tracking blood bank inventory levels. LifeLink bridges the critical gap in emergency medical situations, optimizing blood matching and saving lives.

## Features

* **Role-Based Authentication**: Secure sign-in paths and dashboard routing for Admin, Donor, and Recipient roles.
* **Email & Google Login**: Supports email/password credentials and Google Auth integration.
* **OTP Verification**: Authenticates new users with a 6-digit verification code sent via Gmail SMTP on registration.
* **Donor Eligibility Check**: Interactive clinical questionnaire assessing user demographics, health vitals, and conditions.
* **Blood Request Management**: Enables recipients to file and manage emergency blood request tickets.
* **Smart Donor Matching**: Automatically maps blood request groups directly with active, available compatible donors.
* **Emergency Email Notifications**: Sends automated real-time alert emails to compatible donors for urgent requests.
* **Blood Bank Management**: Administrative management of nearby blood banks and real-time inventory units.
* **Admin Dashboard**: Comprehensive dashboard for viewing logs, managing users, requests, and blood bank status.
* **Donor Dashboard**: Interface for donors to see pending compatible request alerts, log history, and update availability.
* **Recipient Dashboard**: Interface for recipients to post blood requests, view nearby blood banks, and trace open requests.
* **User Profile Management**: Profiles for tracking contact details, locations, blood groups, and status controls.
* **Responsive Design**: Mobile-responsive layout built with Tailwind CSS for optimal viewing across devices.

## Technology Stack

### Frontend
* Svelte 5
* SvelteKit (powered by Vite)
* Tailwind CSS

### Backend
* SvelteKit Server Routes (Node.js API routes)
* Firebase Admin SDK

### Database
* Cloud Firestore

### Authentication
* Firebase Auth (integrated with client-side SDK and custom server-side JWT session cookies via jsonwebtoken)

### Email Service
* Gmail SMTP (via Nodemailer)

### Deployment
* Vercel

## Project Structure

```text
Life-Link/
├── src/
│   ├── lib/
│   │   ├── components/        # Reusable UI components (Eligibility quiz, footer, etc.)
│   │   ├── server/            # Server-side database, Firebase, and email configurations
│   │   ├── firebase.client.js # Client-side Firebase initialization
│   │   └── auth.svelte.js     # Auth state helper
│   └── routes/
│       ├── (dashboard)/       # Protected dashboard layouts and pages
│       │   └── dashboard/     # User role-specific dashboard views (admin, donor, recipient)
│       ├── (public)/          # Public pages (login, register, about, contact, eligibility)
│       └── api/               # API endpoints (auth, blood, requests, users, landing)
├── static/                    # Static assets (images, logos)
├── firebase.rules             # Firestore security rules
├── svelte.config.js           # Svelte configuration
└── vite.config.js             # Vite bundler configuration
```

## Installation

```bash
git clone <repository-url>
npm install
npm run dev
```

## Environment Variables

```env
# Server Configuration (Private)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
JWT_SECRET=supersecretkey123
GMAIL_USER=your-gmail-address@gmail.com
GMAIL_APP_PASSWORD=your-gmail-app-password
PORT=5000

# Client Configuration (Vite-Prefixed)
VITE_FIREBASE_API_KEY=your-client-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

## Demo Credentials

### Admin

Email:
pavithra.workss@gmail.com

Password:
Pavi@2004

### Recipient

Email:
subhasriraman2@gmail.com

Password:
Dhar@2008

### Donor

Email:
pavithramongodb@gmail.com

Password:
Pavi@2004

*Note: The system generates an administrator account on the first initialization check. The credentials above are placeholders that should be set up during initial registration.*

## Project Workflow

```text
Registration
↓
OTP Verification
↓
Login
↓
Dashboard
↓
Blood Request
↓
Donor Matching
↓
Email Notification
↓
Donation Completed
```

1. **Registration**: Users sign up as either a Donor or Recipient. Prospective donors must first pass the interactive eligibility check.
2. **OTP Verification**: A 6-digit one-time passcode is sent to the registered email to activate the user's status.
3. **Login**: Authenticated users log in with their credentials or via Google Auth to establish a secure JWT session.
4. **Dashboard**: Users are routed to their role-specific admin, donor, or recipient dashboard.
5. **Blood Request**: Recipients in need submit emergency blood request tickets specifying unit count, hospital, and urgency level.
6. **Donor Matching**: The system searches the database for active, available donors with the identical blood group.
7. **Email Notification**: The system dispatches an alert email to all matching compatible donors.
8. **Donation Completed**: Once blood is successfully received and the request is completed, a permanent donation history record is created.

## Build & Deployment

* **Vercel**: Hosts the SvelteKit frontend applications and serverless server routes.
* **Firebase**: Hosts user credentials, handles client authentication, and stores data in Cloud Firestore.
* **Gmail SMTP**: Delivers system notification emails, registration verification codes, and emergency alerts.

## License

MIT License
