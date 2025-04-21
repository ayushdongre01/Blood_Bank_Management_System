# 🩸 Blood Bank Management System

A comprehensive blood bank management system built with Node.js, Express, and MySQL. This application streamlines the entire blood donation ecosystem, connecting donors, recipients, hospitals, and blood bank staff on a single platform.



## ✨ Features

- **🔐 User Authentication & Authorization**
  - Secure role-based access control
  - Password hashing and protection
  - Session management for different user types

- **👤 Donor Management**
  - Registration and profile management
  - Donation history tracking
  - Appointment scheduling
  - Donation certificates 

- **🏥 Hospital Portal**
  - Hospital registration and verification
  - Blood request management
  - Recipient tracking and medical history
  - Real-time inventory access

- **📦 Blood Inventory Management**
  - Blood unit tracking by type
  - Automatic update on donations or approving the blood requests

- **🎯 Donation Campaigns**
  - Campaign planning and execution
  - Donor recruitment tools
  - Upcoming donations prior information and countdown


## 🛠️ Technology Stack

- **Backend**: Node.js with Express.js
- **Database**: MySQL
- **Frontend**: HTML5, CSS3, JavaScript, EJS templating
- **Authentication**: Passport.js with session management
- **UI Framework**: Bootstrap 5
- **Form Validation**: Express Validator

## 📋 Prerequisites

- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- npm or yarn

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/blood-bank-management.git](https://github.com/ayushdongre01/Blood_Bank_Management_System.git
   cd blood-bank-management
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   - Create a `.env` file in the root directory with the following:
   ```
   # Database Configuration
   DB_HOST=localhost
   DB_USER=your_mysql_username
   DB_PASSWORD=your_mysql_password
   DB_NAME=bloodbank_db

   # Session Configuration
   SESSION_SECRET=your_session_secret_key

   # Email Configuration (for notifications)
   EMAIL_USERNAME=your_email@gmail.com
   EMAIL_PASSWORD=your_email_password
   EMAIL_SERVICE=gmail

   # Server Configuration
   PORT=3000
   NODE_ENV=development
   ```

4. **Initialize the database**
   ```bash
   npm run init-db
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Navigate to `http://localhost:3000` in your web browser


## 📁 Project Structure

```
blood-bank-management/
├── config/              # Configuration files
├── controllers/         # Route controllers
├── middlewares/         # Custom middlewares
├── models/              # Database models
├── public/              # Static assets
│   ├── css/             # Stylesheets
│   ├── js/              # Client-side JavaScript
│   └── images/          # Images and icons
├── routes/              # Express routes
├── utils/               # Utility functions
├── views/               # EJS templates
├── .env                 # Environment variables
├── app.js               # Application entry point
└── README.md            # Project documentation
```

## 💾 Database Structure

The database comprises 17 interconnected tables to manage the entire blood donation ecosystem:

- **Users** - Authentication and role management
- **Donors** - Donor profiles and medical history
- **Recipients** - Patient information and medical requirements
- **Hospital** - Hospital registration and contact details
- **Blood Inventory** - Blood unit tracking and status
- **Donations** - Donation records and processing status
- **Blood Requests** - Hospital blood requisitions
- **Campaigns** - Blood drive management
- **Staff** - Staff profiles and role assignments


## 👨‍💻 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 👏 Acknowledgments

- [FontAwesome](https://fontawesome.com/) for icons
- [Bootstrap](https://getbootstrap.com/) for UI components
- [Express.js](https://expressjs.com/) for the web framework 
