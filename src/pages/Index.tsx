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
    if (updateTime < thirtyMinutesAgo) return "unknown";
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

  // Helper to apply a single row change to local state (no full refetch)
  const upsertFromRow = (row: any) => {
    setMailRooms(prev => ({
      ...prev,
      [row.name]: {
        name: row.name,
        status: getEffectiveStatus(row.status, row.last_updated),
        lastUpdated: row.last_updated ? new Date(row.last_updated) : null,
      }
    }));
  };

  const removeByRow = (row: any) => {
    setMailRooms(prev => {
      const copy = { ...prev };
      delete copy[row.name];
      return copy;
    });
  };

  // Subscribe to realtime updates
  useEffect(() => {
    // initial load
    loadMailRooms();

    // Test simple broadcast first to verify realtime works
    const testChannel = supabase
      .channel('test-broadcast')
      .on('broadcast', { event: 'test' }, (payload) => {
        console.log('✅ Broadcast test received:', payload);
      })
      .subscribe((status) => {
        console.log('Test broadcast status:', status);
      });

    // Main postgres_changes subscription
    const channel = supabase
      .channel('mail_rooms_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mail_rooms'
        },
        (payload) => {
          console.log('📡 Realtime event received:', payload);
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            console.log('Updating room:', payload.new);
            upsertFromRow(payload.new);
          } else if (payload.eventType === 'DELETE') {
            console.log('Removing room:', payload.old);
            removeByRow(payload.old);
          }
        }
      )
      .subscribe((status, err) => {
        console.log('Realtime subscription status:', status);
        if (err) {
          console.error('Realtime subscription error:', err);
        }
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to mail_rooms changes');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ CHANNEL_ERROR - Check:');
          console.error('1. REPLICA IDENTITY FULL is set');
          console.error('2. Table is in supabase_realtime publication');
          console.error('3. RLS policies allow access');
        } else if (status === 'TIMED_OUT') {
          console.error('❌ Connection timed out');
        } else if (status === 'CLOSED') {
          console.warn('⚠️ Channel closed');
        }
      });

    // Refresh statuses every second to update the 30-minute expiration
    const interval = setInterval(() => {
      setMailRooms((prev) => {
        const updated = { ...prev };
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
        for (const key of Object.keys(updated)) {
          const r = updated[key];
          if (r.lastUpdated && r.lastUpdated < thirtyMinutesAgo && r.status !== 'unknown') {
            updated[key] = { ...r, status: 'unknown' };
          }
        }
        return updated;
      });
    }, 1000);

    return () => {
      supabase.removeChannel(testChannel);
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  const handleUpdateStatus = async (hallName: string, status: MailRoomStatus) => {
    // Optimistic update for the clicking client
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
      // No refetch necessary: other clients will get the UPDATE via realtime,
      // and this client already applied the optimistic change.
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
      // Re-sync if the update failed
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
          <p className="mt-2 text-xs">Updates sync in real-time across all devices</p>
          <p className="mt-2 text-xs">Questions? Email me at smperl@icloud.com</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
