# Om Services Admin Panel

A comprehensive document management system for property registration and legal document processing services.

## 🚀 Features

- **Document Management**: Complete workflow from collection to delivery
- **Payment Tracking**: Comprehensive payment and challan management
- **Task Management**: Role-based task assignment and tracking
- **User Management**: Multi-role access control system
- **Gmail Integration**: Real inbox access and email management
- **Customer & Builder Management**: Relationship tracking and contact management

## 📧 Gmail Integration Setup

To enable real Gmail integration:

### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Enable the Gmail API:
   - Go to "APIs & Services" > "Library"
   - Search for "Gmail API" and enable it

### 2. Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Add authorized origins:
   - `http://localhost:5173` (for local development)
   - `https://gentle-swan-9d664c.netlify.app` (for production)
   - Your custom domain if you have one
5. Copy the Client ID

### 3. Create API Key

1. In "Credentials", click "Create Credentials" > "API Key"
2. Restrict the key to Gmail API for security
3. Copy the API Key

### 4. Environment Configuration

For local development, create a `.env` file in your project root:

```env
VITE_GOOGLE_CLIENT_ID=your_oauth_client_id_here
VITE_GOOGLE_API_KEY=your_api_key_here
```

For production deployment on Netlify:
1. Go to your Netlify site dashboard
2. Navigate to "Site settings" > "Environment variables"
3. Add the same environment variables:
   - `VITE_GOOGLE_CLIENT_ID`
   - `VITE_GOOGLE_API_KEY`
### 5. Domain Authorization

For production deployment, add your domain to:
- OAuth 2.0 authorized origins
- API key restrictions (if applicable)

### 6. Important Notes

- Gmail API has rate limits - the app handles this with batched requests
- Users must grant permission to access their Gmail account
- The app only requests necessary permissions (read, send, modify)
- All Gmail data stays secure and is not stored on your servers

## 🗄️ MySQL Database Setup

### 1. Database Configuration

You have two options to set up your MySQL database:

#### Option A: Use Admin Panel Settings (Recommended)
1. Go to **Settings** in your admin panel
2. Navigate to **MySQL Database** section
3. Enter your hosting provider's MySQL details:
   - **Host**: Your MySQL server (e.g., `localhost` or provided hostname)
   - **Port**: Usually `3306`
   - **Database Name**: Your database name (e.g., `u587606256_om_services_db`)
   - **Username**: Your MySQL username (e.g., `u587606256_omservices`)
   - **Password**: Your MySQL password
   - **SSL Mode**: Usually `preferred` or `disabled`
4. Click **"Test Connection"** to verify
5. **Save Settings** - Tables will be created automatically!

#### Option B: Manual Database Setup

If you prefer manual setup, create a MySQL database and user:

```sql
CREATE DATABASE om_services_db;
CREATE USER 'om_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON om_services_db.* TO 'om_user'@'localhost';
FLUSH PRIVILEGES;
```

### 2. For Your Hosting Provider

Based on your details, use these settings in the admin panel:

```
Host: localhost (or your hosting provider's MySQL host)
Port: 3306
Database Name: u587606256_om_services_db
Username: u587606256_omservices
Password: u587606256_Omservices@121
SSL Mode: preferred
```

### 3. Environment Configuration (Alternative)

Create a `.env` file in your project root:

```env
# Your MySQL Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=u587606256_om_services_db
DB_USER=u587606256_omservices
DB_PASSWORD=u587606256_Omservices@121
DB_SSL_MODE=preferred
```

### 4. Automatic Features

✅ **Auto-Table Creation**: All tables created automatically
✅ **Default Admin User**: Created with email `admin@omservices.com` and password `password123`
✅ **Foreign Key Relationships**: Proper data integrity
✅ **Indexes**: Optimized for performance
✅ **UTF8MB4 Support**: Full Unicode support

### 5. Database Schema (Auto-Created)

The application automatically creates these tables:

- `users` - User accounts and authentication
- `documents` - Document management and workflow
- `tasks` - Task assignment and tracking
- `payments` - Payment records and tracking
- `challans` - Challan management
- `customers` - Customer information
- `builders` - Builder/developer information
- `notifications` - System notifications
- `audit_logs` - Activity tracking

## 🔐 Demo Credentials

For testing without Gmail integration:
- **Main Admin**: admin@omservices.com / password123
- **Challan Staff**: challan@omservices.com / password123

## 🛠 Development

```bash
npm install
npm run dev
```

## 🚀 Deployment

The app is deployed at: https://genuine-crostata-57882a.netlify.app

## 📱 User Roles

- **Main Admin**: Full system access
- **Staff Admin**: Document and user management
- **Challan Staff**: Challan creation and management
- **Field Collection Staff**: Document collection tasks
- **Data Entry Staff**: Document data entry
- **Document Delivery Staff**: Document delivery management

## 🔧 Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Routing**: React Router
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Database**: MySQL
- **Gmail API**: Google APIs Client Library