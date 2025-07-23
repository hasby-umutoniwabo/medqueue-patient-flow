# Setup Instructions for Doctor Selection Feature

## Database Setup Required

To complete the doctor selection feature, you need to run the SQL script in your Supabase dashboard:

### Steps:

1. **Go to your Supabase Dashboard**
   - Visit https://supabase.com/dashboard
   - Open your project: `medqueue-patient-flow`

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run the Setup Script**
   - Copy the contents of `setup_doctors_table.sql` 
   - Paste it into the SQL editor
   - Click "Run" to execute

### What the script does:

- ✅ Creates a `doctors` table with columns: id, name, specialization, is_available
- ✅ Adds `doctor_id` column to existing `queue_entries` table
- ✅ Creates proper indexes for performance
- ✅ Sets up Row Level Security policies
- ✅ Adds 3 sample doctors:
  - Dr. Sarah Johnson (General Medicine)
  - Dr. Michael Chen (Cardiology) 
  - Dr. Emily Davis (Pediatrics)

## Features Added:

### Patient Flow:
1. **National ID Entry** → Check if existing patient
2. **Registration Form** (for new patients only)
3. **Visit Reason Selection** → Choose consultation type
4. **Doctor Selection** → Choose preferred doctor ⭐ **NEW**
5. **Join Queue** → Get queue ticket with doctor info

### Doctor Dashboard:
- ✅ Filter queue by specific doctor or view all
- ✅ Stats show counts per selected doctor
- ✅ Queue displays doctor information
- ✅ Call next patient works per doctor

### Management:
- ✅ New route: `/doctor-management` 
- ✅ Add/remove doctors
- ✅ Toggle doctor availability
- ✅ Manage specializations

### Enhancements:
- ✅ Queue tickets show selected doctor info
- ✅ Announcement screen shows doctor info
- ✅ Each doctor has separate queue positions
- ✅ Queue numbers are per-doctor

## Testing the Feature:

After running the SQL script:

1. Visit `/patient` - Try the full patient registration flow
2. Visit `/doctor` - Test the doctor dashboard with filtering
3. Visit `/doctor-management` - Add/manage doctors
4. Visit `/display` - View the announcement screen

The app will now support multiple doctors with separate queues for each!
