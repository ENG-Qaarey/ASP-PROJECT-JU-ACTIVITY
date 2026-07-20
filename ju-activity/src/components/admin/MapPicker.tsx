import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Crosshair, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

interface MapPickerProps {
  latitude?: number | null;
  longitude?: number | null;
  onLocationSelect: (lat: number, lng: number) => void;
}

const MapPicker = ({ latitude, longitude, onLocationSelect }: MapPickerProps) => {
  const [lat, setLat] = useState(latitude?.toString() || "");
  const [lng, setLng] = useState(longitude?.toString() || "");
  const [locating, setLocating] = useState(false);

  const sync = (la: string, lo: string) => {
    const a = parseFloat(la), b = parseFloat(lo);
    if (!isNaN(a) && !isNaN(b)) onLocationSelect(a, b);
  };

  const set = (la: string, lo: string) => { setLat(la); setLng(lo); sync(la, lo); };

  const locate = () => {
    setLocating(true);
    navigator.geolocation?.getCurrentPosition(
      (p) => { set(p.coords.latitude.toFixed(6), p.coords.longitude.toFixed(6)); setLocating(false); },
      () => { set("31.9539", "35.9106"); setLocating(false); }
    );
  };

  const has = lat && lng && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng));

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium flex items-center gap-2">
        <MapPin className="w-4 h-4 text-muted-foreground" />
        Location Coordinates
      </Label>

      <div className="border rounded-lg p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Latitude</span>
            <Input type="number" step="any" placeholder="31.9539" value={lat}
              onChange={(e) => { setLat(e.target.value); sync(e.target.value, lng); }}
              className="h-8 text-sm" />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Longitude</span>
            <Input type="number" step="any" placeholder="35.9106" value={lng}
              onChange={(e) => { setLng(e.target.value); sync(lat, e.target.value); }}
              className="h-8 text-sm" />
          </div>
        </div>

        <div className="flex gap-2">
          <button type="button" onClick={locate} disabled={locating}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border border-dashed border-border hover:border-primary/50 hover:bg-primary/5 text-muted-foreground hover:text-foreground transition-all duration-200 disabled:opacity-50">
            <Crosshair className={`w-3 h-3 ${locating ? "animate-spin" : ""}`} />
            {locating ? "Locating..." : "My Location"}
          </button>
          {has && (
            <button type="button"
              onClick={() => window.open(`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=15/${lat}/${lng}`, "_blank")}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border border-dashed border-border hover:border-primary/50 hover:bg-primary/5 text-muted-foreground hover:text-foreground transition-all duration-200">
              <ExternalLink className="w-3 h-3" />View on Map
            </button>
          )}
        </div>

        {has && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-[10px] text-muted-foreground">
            {parseFloat(lat).toFixed(4)}, {parseFloat(lng).toFixed(4)}
          </motion.p>
        )}
      </div>
    </div>
  );
};

export default MapPicker;
