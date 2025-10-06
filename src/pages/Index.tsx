import { useState, useEffect } from "react";
import { Mail } from "lucide-react";
import MailRoomCard, { MailRoom, MailRoomStatus } from "@/components/MailRoomCard";
import NeighborhoodSection from "@/components/NeighborhoodSection";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [mailRooms, setMailRooms] = useState<Record<string, MailRoom>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Calculate status with 30-minute expiration
  const getEffectiveStatus = (status: string, lastUpdated: string | null): MailRoomStatus => {
    if (!lastUpdated) return "unknown";
    
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const updateTime = new Date(lastUpdated);
    
    if (updateTime < thirtyMinutesAgo) {
      return "unknown";
    }
    
    return status as MailRoomStatus;
  };

  // Load initial data from database
  const loadMailRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('mail_rooms')
        .select('*')
        .order('name');

      if (error) throw error;

      const roomsMap: Record<string, MailRoom> = {};
      data?.forEach((room) => {
        roomsMap[room.name] = {
          name: room.name,
          status: getEffectiveStatus(room.status, room.last_updated),
          lastUpdated: room.last_updated ? new Date(room.last_updated) : null,
        };
      });

      setMailRooms(roomsMap);
    } catch (error) {
      console.error('Error loading mail rooms:', error);
      toast.error('Failed to load mail room data');
    } finally {
      setIsLoading(false);
    }
  };

  // Subscribe to realtime updates
  useEffect(() => {
    loadMailRooms();

    const channel = supabase
      .channel('mail-rooms-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mail_rooms'
        },
        (payload) => {
          console.log('Realtime update received:', payload);
          loadMailRooms();
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to mail_rooms changes');
        }
      });

    // Refresh statuses every second to update the 30-minute expiration
    const interval = setInterval(() => {
      setMailRooms((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((key) => {
          if (updated[key].lastUpdated) {
            const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
            if (updated[key].lastUpdated! < thirtyMinutesAgo && updated[key].status !== 'unknown') {
              updated[key] = { ...updated[key], status: 'unknown' };
            }
          }
        });
        return updated;
      });
    }, 1000); // Check every second

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  const handleUpdateStatus = async (hallName: string, status: MailRoomStatus) => {
    // Optimistically update local state for instant feedback
    const now = new Date();
    setMailRooms((prev) => ({
      ...prev,
      [hallName]: {
        name: hallName,
        status,
        lastUpdated: now,
      },
    }));

    try {
      const { error } = await supabase
        .from('mail_rooms')
        .update({
          status,
          last_updated: now.toISOString(),
        })
        .eq('name', hallName);

      if (error) throw error;

      const statusText = status === "open" ? "open" : "closed";
      toast.success(`${hallName} mail room marked as ${statusText}`);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
      // Reload from database on error to revert optimistic update
      loadMailRooms();
    }
  };

  const neighborhoods = {
    "East Neighborhood": [
      "DellPlain Hall",
      "Ernie Davis Hall",
      "Oren Lyons Hall",
      "Shaw Hall",
      "Watson Hall",
    ],
    "Mount Olympus Neighborhood": [
      "Day Hall",
      "Flint Hall",
    ],
    "North Neighborhood": [
      "Booth Hall",
      "Haven Hall",
      "Milton Hall",
      "Orange Hall",
      "Walnut Hall",
      "Washington Arms Hall",
    ],
    "West Neighborhood": [
      "Boland Hall",
      "Brewster Hall",
      "Brockway Hall",
      "Lawrinson Hall",
      "Sadler Hall",
    ],
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Mail className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading mail room status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-6 px-4 shadow-md">
        <div className="container mx-auto">
          <div className="flex items-center gap-3">
            <Mail className="h-8 w-8" />
            <div>
              <h1 className="text-3xl font-bold">SU Mail Room Status</h1>
              <p className="text-sm opacity-90">Real-time mail room availability at Syracuse University</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {Object.entries(neighborhoods).map(([neighborhood, halls]) => (
          <NeighborhoodSection key={neighborhood} title={neighborhood}>
            {halls.map((hall) => (
              <MailRoomCard
                key={hall}
                mailRoom={mailRooms[hall] || { name: hall, status: "unknown", lastUpdated: null }}
                onUpdateStatus={(status) => handleUpdateStatus(hall, status)}
              />
            ))}
          </NeighborhoodSection>
        ))}
      </main>

      <footer className="bg-card border-t mt-12 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Community-powered mail room status tracker</p>
          <p className="mt-1">Help your fellow Orange by reporting mail room status!</p>
          <p className="mt-2 text-xs">Status automatically resets to unknown after 30 minutes</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
