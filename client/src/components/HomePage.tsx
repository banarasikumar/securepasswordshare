import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Lock, Shield, Eye, EyeOff } from "lucide-react";
import backgroundImage from "@assets/generated_images/3D_gradient_background_f9c28d68.png";
import shieldIcon from "@assets/generated_images/Security_shield_icon_0f018a4b.png";

interface HomePageProps {
  onPasswordSubmit: (password: string) => void;
  onSetupMaster: () => void;
  hasMasterPassword: boolean;
  isLoading: boolean;
}

export default function HomePage({ onPasswordSubmit, onSetupMaster, hasMasterPassword, isLoading }: HomePageProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim()) {
      onPasswordSubmit(password);
      console.log("Password submitted:", password);
    }
  };

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat relative flex items-center justify-center p-4"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/30 via-black/20 to-transparent"></div>
      
      {/* Floating decorative elements */}
      <div className="absolute top-20 left-10 w-20 h-20 animate-float">
        <img src={shieldIcon} alt="Security" className="w-full h-full opacity-60" />
      </div>
      <div className="absolute bottom-32 right-16 w-16 h-16 bg-primary/20 rounded-full animate-pulse-slow"></div>
      <div className="absolute top-1/3 right-20 w-12 h-12 bg-chart-2/30 rounded-full animate-float" style={{animationDelay: '2s'}}></div>
      
      <Card className="relative z-10 w-full max-w-md mx-auto backdrop-blur-lg bg-card/90 border-card-border/50 shadow-2xl animate-bounce-in">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-primary/20 rounded-full flex items-center justify-center animate-glow">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Secure Password Share</h1>
            <p className="text-muted-foreground">Enter master password to access secure vault</p>
          </div>

          {!hasMasterPassword ? (
            <div className="text-center space-y-4">
              <div className="p-4 rounded-lg bg-muted/50 border border-muted-border">
                <Shield className="w-12 h-12 mx-auto mb-3 text-primary" />
                <h2 className="text-lg font-semibold mb-2">Setup Required</h2>
                <p className="text-sm text-muted-foreground mb-4">Create your master password to secure the vault</p>
                <Button onClick={onSetupMaster} className="w-full" data-testid="button-setup-master">
                  Create Master Password
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Please enter password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter master password"
                    className="pr-10 border-input/50 bg-background/80"
                    data-testid="input-master-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover-elevate"
                    onClick={() => setShowPassword(!showPassword)}
                    data-testid="button-toggle-password"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={!password.trim() || isLoading}
                data-testid="button-unlock-vault"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Authenticating...
                  </>
                ) : (
                  "Unlock Vault"
                )}
              </Button>

              <div className="text-center space-y-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onSetupMaster}
                  className="text-sm"
                  data-testid="button-admin-setup"
                >
                  Admin Setup
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}