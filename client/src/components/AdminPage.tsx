import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, ArrowLeft, Save, Eye, EyeOff } from "lucide-react";
import { PasswordField, PasswordEntryData } from "@shared/schema";
import backgroundImage from "@assets/generated_images/3D_gradient_background_f9c28d68.png";

interface AdminPageProps {
  onSaveEntry: (title: string, fields: PasswordField[]) => void;
  onBack: () => void;
  isLoading?: boolean;
  sessionToken?: string;
  entries?: PasswordEntryData[];
  onLogin?: (password: string) => void;
  onDeleteAll?: () => void;
  isLoggedIn?: boolean;
  loginLoading?: boolean;
  deleteLoading?: boolean;
}

export default function AdminPage({ 
  onSaveEntry, 
  onBack, 
  isLoading,
  sessionToken,
  entries = [],
  onLogin,
  onDeleteAll,
  isLoggedIn = false,
  loginLoading = false,
  deleteLoading = false
}: AdminPageProps) {
  const [title, setTitle] = useState("");
  const [fields, setFields] = useState<PasswordField[]>([
    { name: "Username", value: "", isPassword: false },
    { name: "Password", value: "", isPassword: true }
  ]);
  const [showPasswords, setShowPasswords] = useState<{[key: number]: boolean}>({});
  const [adminPassword, setAdminPassword] = useState("");

  const addField = () => {
    setFields([...fields, { name: "", value: "", isPassword: false }]);
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const updateField = (index: number, field: Partial<PasswordField>) => {
    setFields(fields.map((f, i) => i === index ? { ...f, ...field } : f));
  };

  const togglePasswordVisibility = (index: number) => {
    setShowPasswords(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && fields.some(f => f.name && f.value)) {
      onSaveEntry(title, fields.filter(f => f.name && f.value));
      console.log("Entry saved:", { title, fields });
      // Reset form
      setTitle("");
      setFields([
        { name: "Username", value: "", isPassword: false },
        { name: "Password", value: "", isPassword: true }
      ]);
      setShowPasswords({});
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword.trim() && onLogin) {
      onLogin(adminPassword);
      setAdminPassword("");
    }
  };

  // Show admin login if not logged in
  if (!isLoggedIn) {
    return (
      <div 
        className="min-h-screen bg-cover bg-center bg-no-repeat relative p-4"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-black/30 via-black/20 to-transparent"></div>
        
        <div className="relative z-10 max-w-md mx-auto flex items-center justify-center min-h-screen">
          <Card className="backdrop-blur-lg bg-card/90 border-card-border/50 shadow-2xl animate-slide-in w-full">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">एडमिन लॉगिन</CardTitle>
              <p className="text-muted-foreground">डेटाबेस मैनेज करने के लिए मास्टर पासवर्ड डालें</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-password">मास्टर पासवर्ड</Label>
                  <Input
                    id="admin-password"
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-background/80 border-input/50"
                    data-testid="input-admin-password"
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full hover-elevate"
                  disabled={loginLoading || !adminPassword.trim()}
                  data-testid="button-admin-login"
                >
                  {loginLoading ? "लॉगिन हो रहा है..." : "एडमिन लॉगिन"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
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
        {/* Database Management Section */}
        <Card className="backdrop-blur-lg bg-card/90 border-card-border/50 shadow-2xl animate-slide-in">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold">डेटाबेस मैनेजमेंट</CardTitle>
                <p className="text-muted-foreground">
                  {entries.length > 0 ? `${entries.length} एंट्री मौजूद हैं` : "कोई एंट्री नहीं मिली"}
                </p>
              </div>
              <div className="flex gap-2">
                {entries.length > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={onDeleteAll}
                    disabled={deleteLoading}
                    className="hover-elevate"
                    data-testid="button-remove-all"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {deleteLoading ? "डिलीट हो रहा है..." : "सभी डिलीट करें"}
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          
          {entries.length > 0 && (
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                {entries.map((entry, index) => (
                  <div key={index} className="p-4 rounded-lg bg-background/50 border border-border/50">
                    <h3 className="font-semibold text-lg mb-2">{entry.title}</h3>
                    <div className="grid gap-2">
                      {entry.fields.map((field, fieldIndex) => (
                        <div key={fieldIndex} className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">{field.name}:</span>
                          <span className="font-mono">
                            {field.isPassword ? "••••••••" : field.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>

        {/* Add New Entry Form */}
        <Card className="backdrop-blur-lg bg-card/90 border-card-border/50 shadow-2xl animate-slide-in">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-4">
              <div>
                <CardTitle className="text-2xl font-bold">नई एंट्री जोड़ें</CardTitle>
                <p className="text-muted-foreground">सिक्योर वॉल्ट में नया पासवर्ड एंट्री बनाएं</p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="entry-title" className="text-sm font-medium">
                  Entry Title
                </Label>
                <Input
                  id="entry-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Gmail Account, Bank Login, etc."
                  className="bg-background/80 border-input/50"
                  data-testid="input-entry-title"
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Fields</h3>
                  <Button
                    type="button"
                    onClick={addField}
                    variant="outline"
                    size="sm"
                    className="hover-elevate"
                    data-testid="button-add-field"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Field
                  </Button>
                </div>

                <div className="space-y-4 max-h-80 overflow-y-auto">
                  {fields.map((field, index) => (
                    <Card key={index} className="bg-muted/30 border-muted-border/50">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <Input
                            value={field.name}
                            onChange={(e) => updateField(index, { name: e.target.value })}
                            placeholder="Field name (e.g., Username, Email)"
                            className="bg-background/80 border-input/50"
                            data-testid={`input-field-name-${index}`}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => updateField(index, { isPassword: !field.isPassword })}
                            className={`hover-elevate ${field.isPassword ? 'bg-primary/20' : ''}`}
                            data-testid={`button-toggle-password-field-${index}`}
                          >
                            {field.isPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeField(index)}
                            className="text-destructive hover:bg-destructive/20 hover-elevate"
                            data-testid={`button-remove-field-${index}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <div className="relative">
                          {field.isPassword ? (
                            <div className="relative">
                              <Input
                                type={showPasswords[index] ? "text" : "password"}
                                value={field.value}
                                onChange={(e) => updateField(index, { value: e.target.value })}
                                placeholder="Enter password"
                                className="pr-10 bg-background/80 border-input/50"
                                data-testid={`input-field-value-${index}`}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full px-3 hover-elevate"
                                onClick={() => togglePasswordVisibility(index)}
                                data-testid={`button-toggle-visibility-${index}`}
                              >
                                {showPasswords[index] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </Button>
                            </div>
                          ) : (
                            <Textarea
                              value={field.value}
                              onChange={(e) => updateField(index, { value: e.target.value })}
                              placeholder="Enter value"
                              className="bg-background/80 border-input/50 resize-none"
                              rows={2}
                              data-testid={`textarea-field-value-${index}`}
                            />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <Separator />

              <Button 
                type="submit" 
                className="w-full" 
                disabled={!title.trim() || !fields.some(f => f.name && f.value)}
                data-testid="button-save-entry"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Entry
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}