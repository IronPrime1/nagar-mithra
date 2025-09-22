import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Upload, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function PostIssue() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<{ file: File; preview: string }[]>([]);
  const [location, setLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);

  // Function to get location
  const getCurrentLocation = () => {
    setGettingLocation(true);
    if (!navigator.geolocation) {
      toast({ title: t("error"), description: "Geolocation is not supported by this browser.", variant: "destructive" });
      setGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
          const data = await response.json();
          const address = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
          setLocation({ lat, lng, address });
        } catch {
          setLocation({ lat, lng, address: `${lat.toFixed(6)}, ${lng.toFixed(6)}` });
        } finally {
          setGettingLocation(false);
        }
      },
      (error) => {
        console.error("Error getting location:", error);
        setLocationPermissionDenied(true); // Show button if permission denied
        setGettingLocation(false);
      }
    );
  };

  // Automatically try to get location on mount
  useEffect(() => {
    getCurrentLocation();
  }, []);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (selectedFiles.length + files.length > 3) {
      toast({ title: t("error"), description: "You can upload maximum 3 images.", variant: "destructive" });
      return;
    }
    const newFiles = files.map((file) => ({ file, preview: URL.createObjectURL(file) }));
    setSelectedFiles((prev) => [...prev, ...newFiles]);
    e.currentTarget.value = "";
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const uploadImages = async (): Promise<string[]> => {
    const uploadedPaths: string[] = [];
    for (const { file } of selectedFiles) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user!.id}/${Date.now()}-${Math.random()}.${fileExt}`;
      const { error } = await supabase.storage.from("issue-images").upload(fileName, file);
      if (error) throw error;
      uploadedPaths.push(fileName);
    }
    return uploadedPaths;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast({ title: t("error"), description: "Please enter a title.", variant: "destructive" });
      return;
    }
    if (!user) return;
    setLoading(true);
    try {
      const imagePaths = selectedFiles.length > 0 ? await uploadImages() : [];
      const { error } = await supabase.from("issues").insert({
        title: title.trim(),
        images: imagePaths.length > 0 ? imagePaths : null,
        location_lat: location?.lat || null,
        location_lng: location?.lng || null,
        location_address: location?.address || null,
        created_by: user.id,
      });
      if (error) throw error;
      toast({ title: t("success"), description: "Issue posted successfully!" });
      navigate("/");
    } catch (error) {
      console.error("Error posting issue:", error);
      toast({ title: t("error"), description: "Failed to post issue. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="figtree-text container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>{t("postIssue")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="title">{t("title")} *</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter issue title..." required />
            </div>

            <div>
              <Label>{t("images")} (Max 3)</Label>
              <div className="mt-2">
                <input type="file" accept="image/*" multiple capture="environment" onChange={handleFileSelect} className="hidden" id="image-upload" />
                <Label htmlFor="image-upload" className="flex items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:border-muted-foreground/50 transition-colors">
                  <div className="text-center">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Click to upload images</p>
                  </div>
                </Label>

                {selectedFiles.length > 0 && (
                  <div className="mt-4 grid grid-cols-3 gap-4">
                    {selectedFiles.map((item, index) => (
                      <div key={index} className="relative">
                        <img src={item.preview} alt={`Preview ${index + 1}`} className="w-full h-24 object-cover rounded-lg" />
                        <Button type="button" variant="destructive" size="sm" className="absolute -top-2 -right-2 w-6 h-6 p-0" onClick={() => removeFile(index)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label>{t("location")}</Label>
              <div className="mt-2">
                {location ? (
                  <div className="flex items-start space-x-2 p-3 bg-muted rounded-lg">
                    <MapPin className="w-5 h-5 text-primary mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm">{location.address}</p>
                      <p className="text-xs text-muted-foreground">{location.lat.toFixed(6)}, {location.lng.toFixed(6)}</p>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => setLocation(null)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : locationPermissionDenied ? (
                  <Button type="button" variant="outline" onClick={getCurrentLocation} className="w-full">
                    <MapPin className="w-4 h-4 mr-2" /> Get current location
                  </Button>
                ) : (
                  <p className="text-sm text-muted-foreground">Getting your location...</p>
                )}
              </div>
            </div>

            <div className="flex space-x-4">
              <Button type="button" variant="outline" onClick={() => navigate("/")} className="flex-1">{t("cancel")}</Button>
              <Button type="submit" disabled={loading} className="flex-1">{loading ? t("loading") : t("submit")}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
