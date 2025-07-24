
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { User, UserCheck, Monitor, Clock, Phone, FileText } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link to='/' className="text-3xl font-bold gradient-text">MedQueue</Link>
              <p className="text-gray-600 mt-1">Digital Patient Queue Management System</p>
            </div>
            <Badge className="bg-green-100 text-green-800 text-sm px-3 py-1">
              System Active
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Streamline Your Medical Facility
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Efficient patient queue management with real-time updates, digital registration, 
            and comprehensive dashboard for medical staff.
          </p>
        </div>

        {/* Interface Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Patient Registration */}
          <Card className="border-0 shadow-xl hover:shadow-2xl transition-shadow duration-300">
            <CardHeader className="text-center bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
              <User className="h-12 w-12 mx-auto mb-4" />
              <CardTitle className="text-2xl">Patient Registration</CardTitle>
              <CardDescription className="text-blue-100">
                Quick and easy patient check-in
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Phone className="h-4 w-4 text-blue-500" />
                  <span>Phone number identification</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <FileText className="h-4 w-4 text-blue-500" />
                  <span>Visit reason selection</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span>Real-time queue updates</span>
                </div>
              </div>
              <Link to="/patient">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-lg h-12">
                  Start Registration
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Doctor Dashboard */}
          <Card className="border-0 shadow-xl hover:shadow-2xl transition-shadow duration-300">
            <CardHeader className="text-center bg-gradient-to-r from-green-500 to-green-600 text-white rounded-t-lg">
              <UserCheck className="h-12 w-12 mx-auto mb-4" />
              <CardTitle className="text-2xl">Doctor Dashboard</CardTitle>
              <CardDescription className="text-green-100">
                Manage patient queue and consultations
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <User className="h-4 w-4 text-green-500" />
                  <span>Call next patient</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <FileText className="h-4 w-4 text-green-500" />
                  <span>Queue management</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Clock className="h-4 w-4 text-green-500" />
                  <span>Real-time statistics</span>
                </div>
              </div>
              <Link to="/doctor">
                <Button className="w-full bg-green-600 hover:bg-green-700 text-lg h-12">
                  Access Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Announcement Screen */}
          <Card className="border-0 shadow-xl hover:shadow-2xl transition-shadow duration-300">
            <CardHeader className="text-center bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-t-lg">
              <Monitor className="h-12 w-12 mx-auto mb-4" />
              <CardTitle className="text-2xl">Public Display</CardTitle>
              <CardDescription className="text-purple-100">
                Queue status and announcements
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Monitor className="h-4 w-4 text-purple-500" />
                  <span>Large screen display</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <User className="h-4 w-4 text-purple-500" />
                  <span>Current patient info</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <FileText className="h-4 w-4 text-purple-500" />
                  <span>Live announcements</span>
                </div>
              </div>
              <Link to="/display">
                <Button className="w-full bg-purple-600 hover:bg-purple-700 text-lg h-12">
                  View Display
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Features Section */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">
            Key Features
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Real-time Updates</h4>
              <p className="text-sm text-gray-600">
                Live queue status and instant notifications
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <User className="h-8 w-8 text-green-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Easy Registration</h4>
              <p className="text-sm text-gray-600">
                Quick patient check-in with minimal information
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Monitor className="h-8 w-8 text-purple-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Public Display</h4>
              <p className="text-sm text-gray-600">
                Large screen for waiting room information
              </p>
            </div>
            <div className="text-center">
              <div className="bg-yellow-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <FileText className="h-8 w-8 text-yellow-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Queue Management</h4>
              <p className="text-sm text-gray-600">
                Efficient patient flow and scheduling
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-white py-8 mt-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-gray-300">
            © 2025 MedQueue. Digital Patient Queue Management System.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
