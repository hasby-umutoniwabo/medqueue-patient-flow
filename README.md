# MedQueue - Digital Patient Queue Management System

MedQueue is a modern, digital patient queue management system designed to streamline hospital operations and improve patient experience. The system allows patients to register digitally, join doctor-specific queues, and receive SMS notifications about their queue status.

## 🌟 Features

### 📱 Patient Experience
- **Digital Registration**: Quick patient registration with National ID lookup
- **Smart Queue System**: Join specific doctor queues with real-time wait time estimates
- **SMS Notifications**: Automatic notifications for queue position updates
- **Queue Tickets**: Digital tickets with queue number and estimated wait time
- **Multi-language Support**: Designed for Rwanda (supports national ID format)

### 👨‍⚕️ Doctor Dashboard
- **Personalized Queue Management**: Each doctor manages their own queue
- **Real-time Updates**: Live queue status with patient information
- **Patient Calling System**: Call next patient with automatic notifications
- **Consultation Tracking**: Mark patients as completed or no-show
- **SMS Integration**: Automatic patient notifications for status changes

### 🏥 Hospital Management
- **Doctor Management**: Add, remove, and manage doctor availability
- **Announcement Screen**: Public display for current queue status
- **Real-time Statistics**: Live dashboard with patient counts and metrics
- **Queue Analytics**: Track completed consultations and wait times

### 🔧 Technical Features
- **Real-time Synchronization**: Live updates across all interfaces
- **Mobile Responsive**: Works seamlessly on all device sizes
- **Offline Resilience**: Graceful handling of connection issues
- **SMS Service Integration**: Automated notifications via SMS gateway
- **Database Optimization**: Efficient queries with proper indexing

## 🛠️ Technology Stack

### Frontend
- **React 19.1.0** - Modern UI library with latest features
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Vite** - Fast development build tool
- **React Router** - Client-side routing
- **React Hook Form** - Form state management
- **Radix UI** - Accessible component primitives
- **Lucide React** - Beautiful icons
- **Sonner** - Toast notifications

### Backend & Database
- **Supabase** - Backend-as-a-Service with PostgreSQL
- **Real-time Subscriptions** - Live data synchronization
- **Row Level Security** - Data protection and access control
- **RESTful API** - Auto-generated from database schema

### Additional Services
- **SMS Service** - Patient notification system
- **React Query** - Server state management
- **Zod** - Runtime type validation

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn
- Supabase account and project
- SMS service provider (for notifications)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/hasby-umutoniwabo/medqueue-patient-flow.git
   cd medqueue-patient-flow
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Database Setup**
   - Go to your [Supabase Dashboard](https://supabase.com/dashboard)
   - Open your project SQL Editor
   - Run the setup script from `setup_doctors_table.sql`
   - Or use the complete setup: `complete_database_setup.sql`

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:5173`

## 📋 Database Schema

### Core Tables

#### `patients`
- `id` (UUID, Primary Key)
- `national_id` (Unique, String)
- `full_name` (String)
- `phone_number` (String)
- `date_of_birth` (Date)
- `emergency_contact` (String, Optional)
- `sms_notifications_enabled` (Boolean)

#### `doctors`
- `id` (UUID, Primary Key)
- `name` (String)
- `specialization` (String)
- `email` (String)
- `is_available` (Boolean)

#### `queue_entries`
- `id` (UUID, Primary Key)
- `patient_id` (Foreign Key → patients)
- `doctor_id` (Foreign Key → doctors)
- `queue_number` (Integer)
- `visit_reason` (String)
- `status` (Enum: waiting, in_progress, completed, cancelled)
- `estimated_wait_time` (Integer, minutes)
- `created_at`, `called_at`, `completed_at` (Timestamps)

#### `announcements`
- `id` (UUID, Primary Key)
- `title` (String)
- `message` (Text)
- `priority` (Integer: 1-3)
- `is_active` (Boolean)

## 🔄 Application Flow

### Patient Journey
1. **Entry**: Enter National ID
2. **Verification**: System checks for existing patient
3. **Registration**: New patients complete registration form
4. **Visit Reason**: Select consultation type
5. **Doctor Selection**: Choose preferred doctor with wait time info
6. **Queue Ticket**: Receive digital ticket with queue number
7. **Notifications**: Receive SMS updates about queue position

### Doctor Workflow
1. **Login**: Secure doctor authentication
2. **Dashboard**: View personalized queue and statistics
3. **Call Patient**: Call next patient in queue
4. **Consultation**: Conduct patient consultation
5. **Complete/No-show**: Mark consultation status
6. **Notifications**: Automatic SMS to patients

## 📱 Routes & Pages

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | LandingPage | Homepage with system overview |
| `/index` | Index | System status and quick access |
| `/patient` | PatientRegistration | Patient registration flow |
| `/doctor` | DoctorAuth | Doctor login and dashboard |
| `/doctor-management` | DoctorManagement | Admin panel for doctor management |
| `/display` | AnnouncementScreen | Public queue display screen |

## 🎨 UI Components

The application uses a comprehensive design system built with Radix UI and Tailwind CSS:

### Core Components
- **Navigation** - Responsive navigation with multiple variants
- **Forms** - Accessible form components with validation
- **Cards** - Consistent content containers
- **Buttons** - Multiple button variants and states
- **Badges** - Status and category indicators
- **Toasts** - Non-intrusive notifications
- **Dialogs** - Modal interactions

### Custom Hooks
- `useToast` - Toast notification management
- `useSmsNotifications` - SMS service integration
- `use-mobile` - Mobile device detection

## 📊 SMS Notification System

### Notification Types
- **Welcome Message**: Sent when joining queue
- **Position Updates**: Notifications for top 5 positions
- **You're Next**: When patient is next in line
- **Patient Called**: When it's time for consultation
- **No Show Reminder**: For missed appointments

### SMS Service Features
- Automatic phone number formatting for Rwanda (+250)
- Background sending to avoid UI blocking
- Error handling and fallback mechanisms
- Queue position-based smart notifications

## 🔧 Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Project Structure
```
src/
├── components/          # React components
│   ├── ui/             # Reusable UI components
│   ├── PatientRegistration.tsx
│   ├── DoctorDashboard.tsx
│   ├── DoctorManagement.tsx
│   └── AnnouncementScreen.tsx
├── hooks/              # Custom React hooks
├── integrations/       # External service integrations
├── lib/               # Utility functions
├── pages/             # Page components
├── services/          # Business logic services
└── supabase/          # Supabase configuration
```

### Key Configuration Files
- `vite.config.ts` - Vite configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `tsconfig.json` - TypeScript configuration
- `eslint.config.js` - ESLint rules
- `components.json` - UI component configuration

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Build command
npm run build

# Output directory
dist
```

### Environment Variables for Production
```env
VITE_SUPABASE_URL=your_production_supabase_url
VITE_SUPABASE_ANON_KEY=your_production_supabase_key
```

## 🔐 Security Features

- **Row Level Security (RLS)** on all database tables
- **Input validation** with Zod schemas
- **SQL injection protection** via Supabase
- **Phone number validation** for SMS services
- **National ID format validation** for Rwanda

## 🌍 Localization

The system is designed for Rwanda with:
- National ID format validation (16 digits)
- Phone number formatting (+250)
- Date formats and time zones
- Local SMS gateway integration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use Tailwind CSS for styling
- Implement proper error handling
- Add appropriate loading states
- Write meaningful commit messages
- Test on mobile devices

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the [SETUP_INSTRUCTIONS.md](SETUP_INSTRUCTIONS.md) for detailed setup help
- Review the database setup scripts in the root directory

## 🎯 Future Enhancements

- [ ] Multi-language support (Kinyarwanda, French)
- [ ] Advanced analytics dashboard
- [ ] Appointment scheduling system
- [ ] Integration with hospital management systems
- [ ] Mobile app development
- [ ] QR code integration for faster check-ins
- [ ] Payment integration for consultation fees
- [ ] Doctor availability calendar
- [ ] Patient medical history integration
- [ ] Automated report generation

---

**Built with ❤️ for modern healthcare management**