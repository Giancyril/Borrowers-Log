# NBSC SAS Borrowers Log System

A comprehensive inventory management and borrowing tracking system designed for educational institutions. Built with modern web technologies to streamline the process of borrowing and returning equipment, books, and other resources.

## **Features**

### **Core Functionality**
- **Barcode/QR Code Scanning** - Fast student identification using ZXing library
- **Real-time Inventory Management** - Track item availability and conditions
- **Digital Signatures** - Capture borrower and return signatures
- **Condition Tracking** - Monitor item condition (Good/Minor Issues/Bad)
- **Automated Notifications** - Due date reminders and overdue alerts
- **Google Sheets Integration** - Seamless data export and backup
- **Multi-device Support** - Responsive design for desktop, tablet, and mobile

### **Advanced Features**
- **Student Masterlist Integration** - Automatic student information lookup
- **Template System** - Save and reuse common borrowing scenarios
- **Bulk Operations** - Process multiple items simultaneously
- **Analytics Dashboard** - Borrowing trends and utilization metrics
- **Audit Trail** - Complete transaction history and activity logs
- **Search & Filtering** - Advanced search across all records

## **Technology Stack**

### **Frontend**
- **React 18** - Modern UI framework
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **React Router** - Client-side routing
- **RTK Query** - Data fetching and caching
- **React Hook Form** - Form management
- **ZXing Library** - Barcode scanning
- **Signature Canvas** - Digital signature capture

### **Backend**
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Prisma ORM** - Database management
- **PostgreSQL** - Primary database
- **JWT Authentication** - Secure user sessions
- **Google Sheets API** - External data integration

### **Infrastructure**
- **Vite** - Build tool and development server
- **ESLint & Prettier** - Code quality
- **Docker** - Containerization support
- **GitHub Actions** - CI/CD pipeline

## **User Guide**

### **For Students**
1. **Borrowing Items**
   - Scan student ID or enter details manually
   - Select items and quantity
   - Set borrowing period
   - Provide digital signature
   - Receive confirmation

2. **Returning Items**
   - Staff scans item barcode
   - Records return condition
   - Captures return signature
   - Updates inventory

### **For Administrators**
1. **Inventory Management**
   - Add new items to catalog
   - Update item conditions
   - Set availability status
   - Generate inventory reports

2. **Monitoring**
   - View active borrow records
   - Track overdue items
   - Analyze usage patterns
   - Export data to spreadsheets

## **Security**

### **Authentication & Authorization**
- JWT-based authentication
- Role-based access control
- Session management
- Password hashing with bcrypt

### **Data Protection**
- Input validation and sanitization
- SQL injection prevention with Prisma
- XSS protection
- CSRF protection
- Rate limiting

### **Best Practices**
- Regular security updates
- Dependency vulnerability scanning
- Environment variable encryption
- Audit logging for sensitive operations