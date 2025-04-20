# Blood Bank Management System

A comprehensive blood bank management system built with Node.js, Express, and MySQL. This application facilitates the management of blood donors, recipients, hospitals, blood inventory, donation campaigns, and transfusion records.

## Features

- **User Authentication**: Secure login system for donors, hospitals, staff, and administrators
- **Donor Management**: Registration, profile management, donation history tracking
- **Hospital Management**: Registration, blood request management, recipient tracking
- **Blood Inventory**: Tracking blood units by type, component, and expiration
- **Donation Campaigns**: Organization and management of blood donation drives
- **Transfusion Tracking**: Recording and monitoring blood transfusions
- **Reporting System**: Generate comprehensive reports for various metrics
- **Notification System**: Email notifications for critical events

## Technology Stack

- **Backend**: Node.js with Express.js
- **Database**: MySQL
- **Frontend**: HTML, CSS, JavaScript, EJS templating
- **Authentication**: Passport.js
- **Email**: Nodemailer

## Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/blood-bank-management.git
   cd blood-bank-management
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Configure environment variables
   - Create a `.env` file in the root directory
   - Add the following variables:
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

     # Port
     PORT=3000
     ```

4. Initialize the database
   ```
   npm run init-db
   ```

5. Start the development server
   ```
   npm run dev
   ```

6. Access the application at `http://localhost:3000`

## Default Admin Credentials

- **Username**: admin@bloodbank.com
- **Password**: AdminBlood@2025

## User Roles

1. **Admin**: Full access to all features
2. **Staff**: Access to donation management, inventory, and blood requests
3. **Donor**: Register, view donation history, request donation appointments
4. **Hospital**: Register, request blood, manage recipients

## Database Structure

The database consists of the following main tables:
- Users (Authentication)
- Donors
- Hospitals
- Recipients
- Blood Inventory
- Donations
- Screenings
- Blood Requests
- Transfusions
- Campaigns
- Staff
- Notifications

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Icons by [FontAwesome](https://fontawesome.com/)
- Bootstrap for UI components
- Charts by Chart.js 