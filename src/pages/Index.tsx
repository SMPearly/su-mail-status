import { useState } from "react";
import { Mail } from "lucide-react";
import MailRoomCard, { MailRoom, MailRoomStatus } from "@/components/MailRoomCard";
import NeighborhoodSection from "@/components/NeighborhoodSection";
import { toast } from "sonner";

const Index = () => {
  const [mailRooms, setMailRooms] = useState<Record<string, MailRoom>>({
    // East Neighborhood
    "DellPlain Hall": { name: "DellPlain Hall", status: "unknown", lastUpdated: null },
    "Ernie Davis Hall": { name: "Ernie Davis Hall", status: "unknown", lastUpdated: null },
    "Oren Lyons Hall": { name: "Oren Lyons Hall", status: "unknown", lastUpdated: null },
    "Shaw Hall": { name: "Shaw Hall", status: "unknown", lastUpdated: null },
    "Watson Hall": { name: "Watson Hall", status: "unknown", lastUpdated: null },
    
    // Mount Olympus Neighborhood
    "Day Hall": { name: "Day Hall", status: "unknown", lastUpdated: null },
    "Flint Hall": { name: "Flint Hall", status: "unknown", lastUpdated: null },
    
    // North Neighborhood
    "Booth Hall": { name: "Booth Hall", status: "unknown", lastUpdated: null },
    "Haven Hall": { name: "Haven Hall", status: "unknown", lastUpdated: null },
    "Milton Hall": { name: "Milton Hall", status: "unknown", lastUpdated: null },
    "Orange Hall": { name: "Orange Hall", status: "unknown", lastUpdated: null },
    "Walnut Hall": { name: "Walnut Hall", status: "unknown", lastUpdated: null },
    "Washington Arms Hall": { name: "Washington Arms Hall", status: "unknown", lastUpdated: null },
    
    // West Neighborhood
    "Boland Hall": { name: "Boland Hall", status: "unknown", lastUpdated: null },
    "Brewster Hall": { name: "Brewster Hall", status: "unknown", lastUpdated: null },
    "Brockway Hall": { name: "Brockway Hall", status: "unknown", lastUpdated: null },
    "Lawrinson Hall": { name: "Lawrinson Hall", status: "unknown", lastUpdated: null },
    "Sadler Hall": { name: "Sadler Hall", status: "unknown", lastUpdated: null },
  });

  const handleUpdateStatus = (hallName: string, status: MailRoomStatus) => {
    setMailRooms((prev) => ({
      ...prev,
      [hallName]: {
        ...prev[hallName],
        status,
        lastUpdated: new Date(),
      },
    }));
    
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
