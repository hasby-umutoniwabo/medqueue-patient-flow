import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Trash2, User } from "lucide-react";

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  is_available: boolean;
  created_at: string;
}

const DoctorManagement = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [newDoctor, setNewDoctor] = useState({ name: '', specialization: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setDoctors(data || []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      toast({
        title: "Error",
        description: "Failed to fetch doctors.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoctor.name.trim() || !newDoctor.specialization.trim()) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('doctors')
        .insert([{
          name: newDoctor.name.trim(),
          specialization: newDoctor.specialization.trim(),
          is_available: true
        }]);

      if (error) throw error;

      setNewDoctor({ name: '', specialization: '' });
      fetchDoctors();
      toast({
        title: "Doctor Added",
        description: `Dr. ${newDoctor.name} has been added successfully.`,
      });
    } catch (error) {
      console.error('Error adding doctor:', error);
      toast({
        title: "Error",
        description: "Failed to add doctor.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleAvailability = async (doctorId: string, currentAvailability: boolean) => {
    try {
      const { error } = await supabase
        .from('doctors')
        .update({ is_available: !currentAvailability })
        .eq('id', doctorId);

      if (error) throw error;

      fetchDoctors();
      toast({
        title: "Status Updated",
        description: `Doctor availability has been ${!currentAvailability ? 'enabled' : 'disabled'}.`,
      });
    } catch (error) {
      console.error('Error updating doctor availability:', error);
      toast({
        title: "Error",
        description: "Failed to update doctor status.",
        variant: "destructive",
      });
    }
  };

  const deleteDoctor = async (doctorId: string) => {
    if (!confirm('Are you sure you want to delete this doctor?')) return;

    try {
      const { error } = await supabase
        .from('doctors')
        .delete()
        .eq('id', doctorId);

      if (error) throw error;

      fetchDoctors();
      toast({
        title: "Doctor Deleted",
        description: "Doctor has been removed successfully.",
      });
    } catch (error) {
      console.error('Error deleting doctor:', error);
      toast({
        title: "Error",
        description: "Failed to delete doctor.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading doctors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Doctor Management</h1>
          <p className="text-gray-600">Manage doctors and their availability</p>
        </div>

        {/* Add New Doctor */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Add New Doctor
            </CardTitle>
            <CardDescription>Add a new doctor to the system</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={addDoctor} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="doctor_name">Doctor Name</Label>
                  <Input
                    id="doctor_name"
                    type="text"
                    required
                    value={newDoctor.name}
                    onChange={(e) => setNewDoctor(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Dr. John Smith"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specialization">Specialization</Label>
                  <Input
                    id="specialization"
                    type="text"
                    required
                    value={newDoctor.specialization}
                    onChange={(e) => setNewDoctor(prev => ({ ...prev, specialization: e.target.value }))}
                    placeholder="General Medicine, Cardiology, etc."
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                disabled={isSubmitting || !newDoctor.name.trim() || !newDoctor.specialization.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? "Adding..." : "Add Doctor"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Doctors List */}
        <Card>
          <CardHeader>
            <CardTitle>Current Doctors</CardTitle>
            <CardDescription>Manage existing doctors and their availability</CardDescription>
          </CardHeader>
          <CardContent>
            {doctors.length === 0 ? (
              <div className="text-center py-8">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No doctors added yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {doctors.map((doctor) => (
                  <div key={doctor.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h3 className="font-semibold text-lg">{doctor.name}</h3>
                        <p className="text-gray-600">{doctor.specialization}</p>
                        <p className="text-sm text-gray-500">
                          Added: {new Date(doctor.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={() => toggleAvailability(doctor.id, doctor.is_available)}
                        variant={doctor.is_available ? "default" : "secondary"}
                        size="sm"
                      >
                        {doctor.is_available ? "Available" : "Unavailable"}
                      </Button>
                      <Button
                        onClick={() => deleteDoctor(doctor.id)}
                        variant="destructive"
                        size="sm"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DoctorManagement;
