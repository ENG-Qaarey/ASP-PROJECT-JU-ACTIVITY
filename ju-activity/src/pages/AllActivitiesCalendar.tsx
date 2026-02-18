import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ActivitiesCalendar from '@/components/shared/ActivitiesCalendar';

export default function AllActivitiesCalendarPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Activities Calendar</h1>
            <p className="text-muted-foreground">
              Browse all university activities in calendar view
            </p>
          </div>
        </div>

        {/* Calendar Component */}
        <ActivitiesCalendar userOnly={false} />
      </div>
    </div>
  );
}
