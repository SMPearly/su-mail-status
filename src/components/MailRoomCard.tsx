import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Check, X, HelpCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export type MailRoomStatus = "open" | "closed" | "unknown";

export interface MailRoom {
  name: string;
  status: MailRoomStatus;
  lastUpdated: Date | null;
}

interface MailRoomCardProps {
  mailRoom: MailRoom;
  onUpdateStatus: (status: MailRoomStatus) => void;
}

const MailRoomCard = ({ mailRoom, onUpdateStatus }: MailRoomCardProps) => {
  const getStatusColor = () => {
    switch (mailRoom.status) {
      case "open":
        return "bg-success text-success-foreground";
      case "closed":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusIcon = () => {
    switch (mailRoom.status) {
      case "open":
        return <Check className="h-4 w-4" />;
      case "closed":
        return <X className="h-4 w-4" />;
      default:
        return <HelpCircle className="h-4 w-4" />;
    }
  };

  const getStatusText = () => {
    switch (mailRoom.status) {
      case "open":
        return "Open";
      case "closed":
        return "Closed";
      default:
        return "Unknown";
    }
  };

  return (
    <Card className="p-4 hover:shadow-lg transition-shadow duration-200">
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-base">{mailRoom.name}</h3>
            {mailRoom.lastUpdated && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <Clock className="h-3 w-3" />
                <span>
                  {formatDistanceToNow(mailRoom.lastUpdated, {
                    addSuffix: true,
                  })}
                </span>
              </div>
            )}
          </div>
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}
          >
            {getStatusIcon()}
            <span>{getStatusText()}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant={mailRoom.status === "open" ? "default" : "outline"}
            className="flex-1"
            onClick={() => onUpdateStatus("open")}
          >
            Report Open
          </Button>
          <Button
            size="sm"
            variant={mailRoom.status === "closed" ? "destructive" : "outline"}
            className="flex-1"
            onClick={() => onUpdateStatus("closed")}
          >
            Report Closed
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default MailRoomCard;
