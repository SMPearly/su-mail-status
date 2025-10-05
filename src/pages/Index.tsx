import { useState, useEffect } from "react";
import { Mail } from "lucide-react";
import MailRoomCard, { MailRoom, MailRoomStatus } from "@/components/MailRoomCard";
import NeighborhoodSection from "@/components/NeighborhoodSection";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [mailRooms, setMailRooms] = useState<Record<string, MailRoom>>({});
  const [loading, setLoading] = useState(true);

  // Fetch mail rooms from database
  const fetchMailRooms = async () => {
    const { data, error } = await supabase
      .from("mail_rooms")
      .select("*");

    if (error) {
      console.error("Error fetching mail rooms:", error);
      toast.error("Failed to load mail room data");
      return;
    }

    if (data) {
      const roomsMap: Record<string, MailRoom> = {};
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

      data.forEach((room) => {
        const lastUpdated = new Date(room.last_updated);
        const isExpired = lastUpdated < thirtyMinutesAgo;
        
        roomsMap[room.name] = {
          name: room.name,
          status: isExpired ? "unknown" : (room.status as MailRoomStatus),
          lastUpdated: lastUpdated,
        };
      });

      setMailRooms(roomsMap);
    }
    setLoading(false);
  };

  // Load data on mount
  useEffect(() => {
    fetchMailRooms();

    // Set up realtime subscription
    const channel = supabase
      .channel("mail_rooms_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "mail_rooms",
        },
        () => {
          fetchMailRooms();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Check for expired statuses every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setMailRooms((prev) => {
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
        const updated = { ...prev };
        let hasChanges = false;

        Object.keys(updated).forEach((hallName) => {
          const room = updated[hallName];
          if (room.lastUpdated && room.lastUpdated < thirtyMinutesAgo && room.status !== "unknown") {
            updated[hallName] = { ...room, status: "unknown" };
            hasChanges = true;
          }
        });

        return hasChanges ? updated : prev;
      });
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (hallName: string, status: MailRoomStatus) => {
    const { error } = await supabase
      .from("mail_rooms")
      .update({
        status,
        last_updated: new Date().toISOString(),
      })
      .eq("name", hallName);

    if (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
      return;
    }

    const statusText = status === "open" ? "open" : "closed";
    toast.success(`${hallName} mail room marked as ${statusText}`);
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
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading mail room status...</p>
          </div>
        ) : (
          <>
            {Object.entries(neighborhoods).map(([neighborhood, halls]) => (
              <NeighborhoodSection key={neighborhood} title={neighborhood}>
                {halls.map((hall) => (
                  <MailRoomCard
                    key={hall}
                    mailRoom={mailRooms[hall]}
                    onUpdateStatus={(status) => handleUpdateStatus(hall, status)}
                  />
                ))}
              </NeighborhoodSection>
            ))}
          </>
        )}
      </main>

      <footer className="bg-card border-t mt-12 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Community-powered mail room status tracker</p>
          <p className="mt-1">Help your fellow Orange by reporting mail room status!</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
