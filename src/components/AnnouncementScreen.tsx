const AnnouncementScreen = () => {
  return (
    <div className="min-h-screen bg-blue-900 text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-5xl font-bold mb-6">
          MedQueue Display
        </h1>
        <p className="text-2xl mb-4">
          Patient announcements will be displayed here
        </p>
        <div className="text-lg text-blue-200">
          Waiting for next patient...
        </div>
      </div>
    </div>
  );
};

export default AnnouncementScreen;
