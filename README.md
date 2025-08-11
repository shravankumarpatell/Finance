# FinTrack

> Multi-Workplace Personal Finance Management Platform

**Track. Organize. Analyze.** A modern web application for managing personal finances across multiple workplaces with real-time analytics and comprehensive reporting.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20Site-blue?style=for-the-badge)](https://finance-two-dun.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-039BE5?logo=Firebase&logoColor=white)](https://firebase.google.com/)

## 🌟 Features

### Multi-Workplace Support
- **Workplace Organization**: Create and manage multiple financial workspaces (Personal, Business, Freelance, etc.)
- **Context Switching**: Seamlessly switch between different financial contexts
- **Isolated Data**: Each workplace maintains separate transaction records and analytics

### Modern Authentication
- **Multi-Modal Login**: Email/password and Google OAuth authentication
- **Mobile-Friendly**: Phone number-based registration with secure authentication
- **User Profiles**: Personalized user experience with profile management

### Transaction Management
- **Dual-Method Tracking**: Cash and Online transaction categorization
- **Real-Time Entry**: Add income and expenses with immediate reflection
- **Flexible Dating**: Add transactions for any date within the last 3 months
- **Smart Validation**: Prevents future-dated transactions and invalid entries

### Advanced Analytics
- **Real-Time Dashboards**: Live financial overview with visual breakdowns
- **Monthly/Yearly Views**: Comprehensive time-based financial analysis
- **Category Breakdown**: Detailed Cash vs Online transaction analytics
- **Dynamic Filtering**: Filter by date, month, or custom date ranges

### Professional Reporting
- **PDF Generation**: Automated monthly and annual financial reports
- **Custom Reports**: Generate reports for any date range
- **Professional Formatting**: Clean, printable financial statements
- **Multi-Format Export**: Download reports in multiple formats

### Data Management
- **Automatic Cleanup**: Smart data retention with automatic old data removal
- **Real-Time Sync**: Live data synchronization across devices
- **Secure Storage**: Firebase Firestore for reliable data persistence
- **Data Isolation**: Complete separation between different users and workplaces

## Technical Architecture

### Frontend Stack
- **React 18** - Modern component-based UI framework
- **TypeScript** - Type-safe development with enhanced DX
- **Tailwind CSS** - Utility-first CSS framework for rapid styling
- **Vite** - Lightning-fast build tool and development server
- **Shadcn/UI** - Modern, accessible component library

### Backend & Services
- **Firebase Authentication** - Secure user authentication and management
- **Firestore Database** - NoSQL cloud database with real-time sync
- **Vercel Hosting** - Edge-optimized deployment and hosting

### Key Libraries & Tools
- **jsPDF + AutoTable** - Professional PDF report generation
- **React Hook Form** - Efficient form state management
- **Lucide React** - Beautiful, consistent iconography
- **Date-fns** - Powerful date manipulation utilities

## 🚀 Getting Started

### Prerequisites

```bash
Node.js 18+
npm or yarn
Git
```

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/shravankumarpatell/Finance.git
   cd Finance
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Create .env file in root directory
   cp .env.example .env
   
   # Add your Firebase configuration
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. **Firebase Setup**
   ```bash
   # Install Firebase CLI
   npm install -g firebase-tools
   
   # Login to Firebase
   firebase login
   
   # Initialize Firebase project
   firebase init
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Local: http://localhost:5173
   - Production: https://finance-two-dun.vercel.app

## 📁 Project Structure

```
src/
├── components/           # React components
│   ├── auth/            # Authentication components
│   ├── layout/          # Layout components (Header, Theme Toggle)
│   ├── ui/              # Reusable UI components (Shadcn/UI)
│   ├── dashboard.tsx    # Main dashboard component
│   ├── transaction-*.tsx # Transaction management components
│   └── workplace-*.tsx  # Workplace management components
├── contexts/            # React context providers
│   ├── theme-provider.tsx
│   └── workplace-context.tsx
├── hooks/               # Custom React hooks
│   ├── use-auth.tsx
│   ├── use-workplaces.ts
│   └── use-data-cleanup.ts
├── lib/                 # Utility libraries
│   ├── pdf-generator.ts # PDF report generation
│   └── utils.ts         # General utilities
├── pages/               # Page components
│   ├── login.tsx
│   └── MainDashboardPage.tsx
├── firebase/            # Firebase configuration
│   └── config.ts
├── types/               # TypeScript type definitions
└── App.tsx             # Main application component
```

## 💡 Usage Guide

### Creating Your First Workplace

1. **Sign up** using email/password or Google OAuth
2. **Create a workspace** - Enter a name like "Personal" or "Business"
3. **Start tracking** - Add your first income or expense transaction

### Managing Transactions

```typescript
// Transaction types supported
type TransactionType = "income" | "expense";
type PaymentMethod = "Cash" | "Online";

// Example transaction
{
  type: "income",
  category: "Online",
  amount: 5000.00,
  date: new Date(),
  detail: "Salary payment",
  workplaceId: "workplace_id"
}
```

### Generating Reports

1. **Monthly Reports**: Automatic generation for current month
2. **Annual Reports**: Complete yearly financial summary
3. **Custom Reports**: Select any date range for analysis

### Workplace Management

- **Switch Workplaces**: Use header dropdown to switch contexts
- **Add New Workplace**: Click "+" to create additional workspaces
- **Data Isolation**: Each workplace maintains separate financial records

## 🔧 Configuration

### Firebase Configuration

```javascript
// src/firebase/config.ts
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  // ... other config
};
```

### Firestore Security Rules

```javascript
// Firestore rules for data isolation
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /workplaces/{workplaceId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    match /transactions/{transactionId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
  }
}
```

## Deployment

### Vercel Deployment

1. **Connect Repository**
   ```bash
   # Install Vercel CLI
   npm install -g vercel
   
   # Deploy
   vercel --prod
   ```

2. **Environment Variables**
   Add all Firebase configuration variables in Vercel dashboard

3. **Build Settings**
   ```json
   {
     "buildCommand": "npm run build",
     "outputDirectory": "dist",
     "framework": "vite"
   }
   ```

## Testing

```bash
# Run unit tests
npm run test

# Run with coverage
npm run test:coverage

# E2E tests
npm run test:e2e
```

## Performance Features

- **Code Splitting**: Lazy-loaded components for optimal bundle size
- **Real-time Updates**: Live data synchronization without page refreshes
- **Optimistic Updates**: Immediate UI feedback for better UX
- **Caching**: Efficient data caching for improved performance
- **PWA Ready**: Service worker support for offline functionality

## Security Features

- **Data Isolation**: Complete separation between users and workplaces
- **Input Validation**: Client and server-side validation
- **Secure Authentication**: Firebase Auth with multiple providers
- **HTTPS Enforcement**: End-to-end encryption for all communications

## Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** with proper TypeScript types
4. **Add tests** for new functionality
5. **Commit changes**: `git commit -m 'Add amazing feature'`
6. **Push to branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**

### Development Guidelines

- Follow TypeScript best practices
- Use meaningful component and variable names
- Add JSDoc comments for complex functions
- Ensure responsive design for mobile devices
- Test across different browsers and screen sizes

## API Documentation

### Authentication

```typescript
// User authentication
interface User {
  uid: string;
  email?: string;
  displayName?: string;
  phoneNumber?: string;
}
```

### Workplaces

```typescript
interface Workplace {
  id: string;
  name: string;
  userId: string;
  createdAt: Date;
  isActive: boolean;
}
```

### Transactions

```typescript
interface Transaction {
  id: string;
  type: "income" | "expense";
  category: "Cash" | "Online";
  amount: number;
  date: Timestamp;
  userId: string;
  workplaceId: string;
  detail?: string;
  year: number;
  month: number;
}
```

## Troubleshooting

### Common Issues

**Firebase connection errors**
- Check your Firebase configuration
- Verify API keys are correctly set
- Ensure Firestore rules allow access

**PDF generation issues**
- Verify jsPDF dependencies are installed
- Check browser compatibility for PDF generation
- Ensure sufficient data exists for report generation

**Authentication problems**
- Clear browser cache and cookies
- Check Firebase Authentication settings
- Verify OAuth provider configurations

##  Analytics & Monitoring

- **Real-time Usage**: Monitor active users and sessions
- **Performance Tracking**: Page load times and user interactions
- **Error Monitoring**: Automatic error reporting and tracking
- **User Feedback**: Built-in feedback collection system

##  Roadmap

### Upcoming Features
- [ ] **Budget Planning**: Set and track monthly budgets
- [ ] **Investment Tracking**: Stock and mutual fund portfolio management
- [ ] **Expense Categories**: Detailed categorization system
- [ ] **Data Visualization**: Advanced charts and graphs
- [ ] **Mobile App**: React Native mobile application
- [ ] **Bank Integration**: Direct bank account synchronization
- [ ] **Receipt Scanner**: OCR-based receipt processing
- [ ] **Multi-Currency**: Support for multiple currencies
- [ ] **Tax Reporting**: Automated tax document generation

## Support

- **Email**: shravankumarpatelofficial@gmail.com
- **GitHub Issues**: Report bugs and request features
- **Documentation**: Comprehensive guides and tutorials

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- **Firebase** for backend infrastructure and authentication
- **Vercel** for seamless deployment and hosting
- **Shadcn/UI** for beautiful, accessible components
- **Tailwind CSS** for efficient styling system
- **React & TypeScript** communities for excellent tools and resources

---

<div align="center">

**Built with ❤️ by Shravan Kumar Patel**

⭐ Star this repository if you find it useful!

[Live Demo](https://finance-two-dun.vercel.app) | [Report Bug](https://github.com/shravankumarpatell/Finance/issues) | [Request Feature](https://github.com/shravankumarpatell/Finance/issues)

</div>
