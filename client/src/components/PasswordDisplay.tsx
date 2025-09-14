import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Copy, Timer, ArrowLeft, Trash2 } from "lucide-react";
import { PasswordField, PasswordEntryData } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import backgroundImage from "@assets/generated_images/3D_gradient_background_f9c28d68.png";
import ConfirmationDialog from "@/components/ConfirmationDialog";


interface PasswordDisplayProps {
  entries: PasswordEntryData[];
  onBack: () => void;
  onDeleteAll: () => void;
  onGoToAdmin: () => void;
  isLoading?: boolean;
  sessionExpiry?: Date | null;
}

export default function PasswordDisplay({ entries, onBack, onDeleteAll, onGoToAdmin, isLoading, sessionExpiry }: PasswordDisplayProps) {
  const [visiblePasswords, setVisiblePasswords] = useState<{[key: string]: boolean}>({});
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [hasSaved, setHasSaved] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();

  // Calculate time since session started (for security awareness)
  useEffect(() => {
    if (entries.length === 0) return;

    const sessionStart = new Date();
    
    const updateTimer = () => {
      const now = new Date();
      const timeDiff = now.getTime() - sessionStart.getTime();
      
      const hours = Math.floor(timeDiff / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
      
      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    
    return () => clearInterval(interval);
  }, [entries]);

  const togglePasswordVisibility = (entryIndex: number, fieldIndex: number) => {
    const key = `${entryIndex}-${fieldIndex}`;
    setVisiblePasswords(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const copyToClipboard = async (value: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast({
        title: "Copied!",
        description: `${fieldName} copied to clipboard`,
      });
      console.log(`Copied ${fieldName}:`, value);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = () => {
    onDeleteAll();
    setShowDeleteDialog(false);
    console.log("All passwords deleted");
  };

  if (entries.length === 0) {
    return (
      <div 
        className="min-h-screen bg-cover bg-center bg-no-repeat relative flex items-center justify-center p-4"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-black/30 via-black/20 to-transparent"></div>
        
        <Card className="relative z-10 w-full max-w-md mx-auto backdrop-blur-lg bg-card/90 border-card-border/50 shadow-2xl">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">No Passwords Found</h2>
            <p className="text-muted-foreground mb-6">No password entries available to display.</p>
            <Button onClick={onBack} data-testid="button-back-empty">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat relative p-4"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-black/30 via-black/20 to-transparent"></div>
      
      <div className="relative z-10 max-w-4xl mx-auto space-y-6">
        {/* Header with timer */}
        <Card className="backdrop-blur-lg bg-card/90 border-card-border/50 shadow-2xl animate-slide-in">
          <CardHeader>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
                className="hover-elevate"
                data-testid="button-back-display"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="flex-1">
                <CardTitle className="text-2xl font-bold">Password Vault</CardTitle>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-2">
                    <Timer className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Session Time: </span>
                    <Badge variant={timeLeft === "Expired" ? "destructive" : "default"} data-testid="badge-time-left">
                      {timeLeft}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Warning message in Hindi */}
        <Card className="backdrop-blur-lg bg-destructive/10 border-destructive/20 shadow-lg">
          <CardContent className="p-4">
            <p className="text-sm text-center text-destructive-foreground font-medium" data-testid="text-hindi-warning">
              अब से 24 घंटे के अंदर यह सभी Details, Passwords को कॉपी कर लें या कहीं सुरक्षित जगह पर लिख लें या save कर लें, अन्यथा यह सभी permanently delete हो जाएगा,
              <br />
              या आप save करने के बाद तुरंत भी यहां से delete कर सकते हैं।
            </p>
          </CardContent>
        </Card>

        {/* Password entries */}
        <div className="space-y-4">
          {entries.map((entry, entryIndex) => (
            <Card key={entryIndex} className="backdrop-blur-lg bg-card/90 border-card-border/50 shadow-xl animate-bounce-in" style={{animationDelay: `${entryIndex * 0.1}s`}}>
              <CardHeader>
                <CardTitle className="text-xl font-semibold">{entry.title}</CardTitle>
                <Separator />
              </CardHeader>
              <CardContent className="space-y-4">
                {entry.fields.map((field, fieldIndex) => (
                  <div key={fieldIndex} className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      {field.name}
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 relative">
                        <div className="p-3 bg-muted/50 rounded-md border border-muted-border/50 font-mono text-sm">
                          {field.isPassword && !visiblePasswords[`${entryIndex}-${fieldIndex}`] 
                            ? '••••••••••••' 
                            : field.value
                          }
                        </div>
                      </div>
                      
                      {field.isPassword && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => togglePasswordVisibility(entryIndex, fieldIndex)}
                          className="hover-elevate"
                          data-testid={`button-toggle-${entryIndex}-${fieldIndex}`}
                        >
                          {visiblePasswords[`${entryIndex}-${fieldIndex}`] ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                      
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(field.value, field.name)}
                        className="hover-elevate"
                        data-testid={`button-copy-${entryIndex}-${fieldIndex}`}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Delete section */}
        <Card className="backdrop-blur-lg bg-card/90 border-card-border/50 shadow-xl">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="saved-checkbox" 
                checked={hasSaved}
                onCheckedChange={(checked) => setHasSaved(checked as boolean)}
                data-testid="checkbox-saved"
              />
              <label htmlFor="saved-checkbox" className="text-sm font-medium cursor-pointer">
                मैंने save कर लिया हैं।
              </label>
            </div>
            
            <Button
              variant="destructive"
              onClick={handleDeleteClick}
              disabled={!hasSaved}
              className="w-full"
              data-testid="button-delete-all"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              अभी delete करें।
            </Button>
          </CardContent>
        </Card>
      </div>

      <ConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteConfirm}
        title="Confirm Deletion"
        message="सभी passwords यहां से permanently delete हो जाएगा क्या आप सहमत हैं?"
        confirmText="हां"
        cancelText="नहीं"
      />
    </div>
  );
}