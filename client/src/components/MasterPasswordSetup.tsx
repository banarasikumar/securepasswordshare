import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Eye, EyeOff, Shield, ArrowLeft } from "lucide-react";
import backgroundImage from "@assets/generated_images/3D_gradient_background_f9c28d68.png";

interface MasterPasswordSetupProps {
  onCreateMaster: (password: string) => void;
  onBack: () => void;
  isLoading?: boolean;
}

export default function MasterPasswordSetup({ onCreateMaster, onBack, isLoading }: MasterPasswordSetupProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === confirmPassword && password.length >= 6) {
      onCreateMaster(password);
      console.log("Master password created");
    }
  };

  const isValid = password === confirmPassword && password.length >= 6;

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat relative flex items-center justify-center p-4"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-black/30 via-black/20 to-transparent"></div>
      
      <Card className="relative z-10 w-full max-w-md mx-auto backdrop-blur-lg bg-card/90 border-card-border/50 shadow-2xl animate-slide-in">
        <CardHeader className="text-center pb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="absolute left-4 top-4 hover-elevate"
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="w-16 h-16 mx-auto mb-4 bg-primary/20 rounded-full flex items-center justify-center animate-glow">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Create Master Password</CardTitle>
          <p className="text-muted-foreground text-sm">Secure your password vault with a strong master password</p>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Master Password (minimum 6 characters)
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter master password"
                  className="pr-10 border-input/50 bg-background/80"
                  data-testid="input-new-master-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover-elevate"
                  onClick={() => setShowPassword(!showPassword)}
                  data-testid="button-toggle-new-password"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Confirm Master Password
              </label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm master password"
                  className="pr-10 border-input/50 bg-background/80"
                  data-testid="input-confirm-master-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover-elevate"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  data-testid="button-toggle-confirm-password"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {password && confirmPassword && password !== confirmPassword && (
              <p className="text-destructive text-sm" data-testid="text-password-mismatch">
                Passwords do not match
              </p>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={!isValid}
              data-testid="button-create-master"
            >
              <Lock className="w-4 h-4 mr-2" />
              Create Master Password
            </Button>
          </form>

          <div className="text-center text-xs text-muted-foreground">
            <p>Your master password will encrypt and protect all stored passwords.</p>
            <p className="mt-1 font-medium">Remember this password - it cannot be recovered!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}