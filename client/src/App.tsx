import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery, useMutation } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import HomePageComponent from "@/components/HomePage";
import MasterPasswordSetup from "@/components/MasterPasswordSetup";
import AdminPage from "@/components/AdminPage";
import PasswordDisplay from "@/components/PasswordDisplay";
import NotFound from "@/pages/not-found";
import { PasswordField, PasswordEntryData } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

// App state management
type AppState = "home" | "setup" | "admin" | "display";

// API functions for backend communication
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const response = await fetch(`/api${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || data.error || "API request failed");
  }
  
  return data;
};

function MainApp() {
  const [currentState, setCurrentState] = useState<AppState>("home");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionToken, setSessionToken] = useState<string>("");
  const [sessionExpiry, setSessionExpiry] = useState<Date | null>(null);
  const [passwordEntries, setPasswordEntries] = useState<PasswordEntryData[]>([]);
  const { toast } = useToast();

  // Check if master password exists
  const { data: masterPasswordExists, isLoading: checkingMaster } = useQuery({
    queryKey: ["/api/master-password/exists"],
    queryFn: () => apiRequest("/master-password/exists"),
  });

  // Create master password mutation
  const createMasterPasswordMutation = useMutation({
    mutationFn: (password: string) =>
      apiRequest("/master-password/create", {
        method: "POST",
        body: JSON.stringify({ masterPassword: password }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/master-password/exists"] });
      setCurrentState("home");
      toast({
        title: "Success",
        description: "Master password created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // SECURITY FIX: Create secure session instead of verifying password
  const createSessionMutation = useMutation({
    mutationFn: (password: string) =>
      apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ masterPassword: password }),
      }),
    onSuccess: (data) => {
      setIsAuthenticated(true);
      setSessionToken(data.sessionToken);
      setSessionExpiry(new Date(data.expiresAt));
      setCurrentState("display");
      loadPasswordEntries(data.sessionToken);
      toast({
        title: "Success",
        description: "Authentication successful - secure session created",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Authentication Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // SECURITY FIX: Load password entries using session token
  const loadPasswordEntries = async (token: string) => {
    try {
      const response = await apiRequest("/password-entries/list", {
        method: "POST",
        body: JSON.stringify({ sessionToken: token }),
      });
      setPasswordEntries(response.entries);
    } catch (error) {
      if (error instanceof Error && error.message.includes("Invalid session")) {
        // Session expired - redirect to login
        handleLogout();
        return;
      }
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load entries",
        variant: "destructive",
      });
    }
  };

  // SECURITY FIX: Create password entry using session token
  const createPasswordEntryMutation = useMutation({
    mutationFn: (entry: PasswordEntryData) =>
      apiRequest("/password-entries", {
        method: "POST",
        body: JSON.stringify({ sessionToken, entry }),
      }),
    onSuccess: () => {
      loadPasswordEntries(sessionToken);
      toast({
        title: "Success",
        description: "Password entry created successfully",
      });
    },
    onError: (error: Error) => {
      if (error instanceof Error && error.message.includes("Invalid session")) {
        handleLogout();
        return;
      }
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // SECURITY FIX: Delete all entries using session token
  const deleteAllEntriesMutation = useMutation({
    mutationFn: () =>
      apiRequest("/password-entries/delete-all", {
        method: "POST",
        body: JSON.stringify({ sessionToken }),
      }),
    onSuccess: () => {
      setPasswordEntries([]);
      handleLogout();
      toast({
        title: "Success",
        description: "All entries deleted successfully",
      });
    },
    onError: (error: Error) => {
      if (error instanceof Error && error.message.includes("Invalid session")) {
        handleLogout();
        return;
      }
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // SECURITY FIX: Logout functionality with session cleanup
  const logoutMutation = useMutation({
    mutationFn: () =>
      apiRequest("/auth/logout", {
        method: "POST",
        body: JSON.stringify({ sessionToken }),
      }),
    onSuccess: () => {
      handleLogout();
      toast({
        title: "Success",
        description: "Logged out successfully",
      });
    },
    onError: () => {
      // Logout locally even if server request fails
      handleLogout();
    },
  });

  const handleLogout = () => {
    setPasswordEntries([]);
    setIsAuthenticated(false);
    setSessionToken("");
    setSessionExpiry(null);
    setCurrentState("home");
  };

  const handlePasswordSubmit = (password: string) => {
    createSessionMutation.mutate(password);
  };

  const handleSetupMaster = () => {
    setCurrentState("setup");
  };

  const handleCreateMaster = (password: string) => {
    createMasterPasswordMutation.mutate(password);
  };

  const handleGoToAdmin = () => {
    setCurrentState("admin");
  };

  const handleSaveEntry = (title: string, fields: PasswordField[]) => {
    if (!sessionToken || !isAuthenticated) {
      toast({
        title: "Error",
        description: "Not authenticated - please log in again",
        variant: "destructive",
      });
      handleLogout();
      return;
    }

    const entry: PasswordEntryData = { title, fields };
    createPasswordEntryMutation.mutate(entry);
  };

  const handleDeleteAll = () => {
    if (!sessionToken || !isAuthenticated) {
      toast({
        title: "Error",
        description: "Not authenticated - please log in again",
        variant: "destructive",
      });
      handleLogout();
      return;
    }

    deleteAllEntriesMutation.mutate();
  };

  const handleGoHome = () => {
    logoutMutation.mutate();
  };

  // SECURITY FIX: Session expiry check
  useEffect(() => {
    if (sessionExpiry && new Date() > sessionExpiry) {
      toast({
        title: "Session Expired",
        description: "Please log in again",
        variant: "destructive",
      });
      handleLogout();
    }
  }, [sessionExpiry]);

  // Old state-based navigation removed - using proper routing now
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePageRoute} />
      <Route path="/admin" component={AdminPageRoute} />
      <Route component={NotFound} />
    </Switch>
  );
}

// Homepage Route Component
function HomePageRoute() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionToken, setSessionToken] = useState<string>("");
  const [sessionExpiry, setSessionExpiry] = useState<Date | null>(null);
  const [passwordEntries, setPasswordEntries] = useState<PasswordEntryData[]>([]);
  const { toast } = useToast();

  // Check if master password exists
  const { data: masterPasswordExists, isLoading: checkingMaster } = useQuery({
    queryKey: ["/api/master-password/exists"],
    queryFn: () => apiRequest("/master-password/exists"),
  });

  // Create secure session (login)
  const createSessionMutation = useMutation({
    mutationFn: (password: string) =>
      apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ masterPassword: password }),
      }),
    onSuccess: (data) => {
      setIsAuthenticated(true);
      setSessionToken(data.sessionToken);
      setSessionExpiry(new Date(data.expiresAt));
      loadPasswordEntries(data.sessionToken);
      toast({
        title: "सफल!",
        description: "पासवर्ड सत्यापित - टाइमर शुरू हुआ",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "गलत पासवर्ड",
        description: "कृपया सही मास्टर पासवर्ड डालें",
        variant: "destructive",
      });
    },
  });

  // Load password entries using session token
  const loadPasswordEntries = async (token: string) => {
    try {
      const response = await apiRequest("/password-entries/list", {
        method: "POST",
        body: JSON.stringify({ sessionToken: token }),
      });
      setPasswordEntries(response.entries);
    } catch (error) {
      if (error instanceof Error && error.message.includes("Invalid session")) {
        handleLogout();
        return;
      }
      toast({
        title: "त्रुटि",
        description: "डेटा लोड नहीं हो सका",
        variant: "destructive",
      });
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setSessionToken("");
    setSessionExpiry(null);
    setPasswordEntries([]);
  };

  const handlePasswordSubmit = (password: string) => {
    createSessionMutation.mutate(password);
  };

  // Show password entries if authenticated
  if (isAuthenticated && passwordEntries.length > 0) {
    return (
      <PasswordDisplay
        entries={passwordEntries}
        onBack={handleLogout}
        onDeleteAll={() => {}} // Not needed for users
        onGoToAdmin={() => {}} // Not needed for users
        isLoading={false}
        sessionExpiry={sessionExpiry}
      />
    );
  }

  // Show homepage for password entry
  return (
    <HomePageComponent
      onPasswordSubmit={handlePasswordSubmit}
      onSetupMaster={() => {}} // Not needed - admin sets up master password
      hasMasterPassword={masterPasswordExists?.exists || false}
      isLoading={createSessionMutation.isPending || checkingMaster}
    />
  );
}

// Admin Page Route Component
function AdminPageRoute() {
  const [sessionToken, setSessionToken] = useState<string>("");
  const [passwordEntries, setPasswordEntries] = useState<PasswordEntryData[]>([]);
  const { toast } = useToast();

  // Check if master password exists
  const { data: masterPasswordExists } = useQuery({
    queryKey: ["/api/master-password/exists"],
    queryFn: () => apiRequest("/master-password/exists"),
  });

  // Create master password mutation
  const createMasterPasswordMutation = useMutation({
    mutationFn: (password: string) =>
      apiRequest("/master-password/create", {
        method: "POST",
        body: JSON.stringify({ masterPassword: password }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/master-password/exists"] });
      toast({
        title: "मास्टर पासवर्ड बनाया गया",
        description: "अब आप पासवर्ड एंट्री बना सकते हैं",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "त्रुटि",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Admin login for managing entries
  const adminLoginMutation = useMutation({
    mutationFn: (password: string) =>
      apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ masterPassword: password }),
      }),
    onSuccess: (data) => {
      setSessionToken(data.sessionToken);
      loadPasswordEntries(data.sessionToken);
      toast({
        title: "एडमिन लॉगिन सफल",
        description: "अब आप एंट्री मैनेज कर सकते हैं",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "गलत पासवर्ड",
        description: "एडमिन पासवर्ड गलत है",
        variant: "destructive",
      });
    },
  });

  // Load password entries
  const loadPasswordEntries = async (token: string) => {
    try {
      const response = await apiRequest("/password-entries/list", {
        method: "POST",
        body: JSON.stringify({ sessionToken: token }),
      });
      setPasswordEntries(response.entries);
    } catch (error) {
      console.error("Failed to load entries:", error);
    }
  };

  // Create password entry
  const createPasswordEntryMutation = useMutation({
    mutationFn: ({ title, fields }: { title: string; fields: PasswordField[] }) =>
      apiRequest("/password-entries", {
        method: "POST",
        body: JSON.stringify({ sessionToken, title, fields }),
      }),
    onSuccess: () => {
      if (sessionToken) {
        loadPasswordEntries(sessionToken);
      }
      toast({
        title: "एंट्री सेव हुई",
        description: "पासवर्ड एंट्री सफलतापूर्वक बनाई गई",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "त्रुटि",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete all entries
  const deleteAllEntriesMutation = useMutation({
    mutationFn: () =>
      apiRequest("/password-entries/delete-all", {
        method: "POST",
        body: JSON.stringify({ sessionToken }),
      }),
    onSuccess: () => {
      setPasswordEntries([]);
      toast({
        title: "सभी एंट्री डिलीट हुईं",
        description: "डेटाबेस साफ कर दिया गया",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "त्रुटि",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSaveEntry = (title: string, fields: PasswordField[]) => {
    createPasswordEntryMutation.mutate({ title, fields });
  };

  // Show master password setup if none exists
  if (!masterPasswordExists?.exists) {
    return (
      <MasterPasswordSetup
        onCreateMaster={(password: string) => createMasterPasswordMutation.mutate(password)}
        onBack={() => {}} // No back for admin setup
        isLoading={createMasterPasswordMutation.isPending}
      />
    );
  }

  // Show admin page with database management
  return (
    <AdminPage
      onSaveEntry={handleSaveEntry}
      onBack={() => {}} // No back for direct admin access
      isLoading={createPasswordEntryMutation.isPending}
      sessionToken={sessionToken}
      entries={passwordEntries}
      onLogin={(password: string) => adminLoginMutation.mutate(password)}
      onDeleteAll={() => deleteAllEntriesMutation.mutate()}
      isLoggedIn={!!sessionToken}
      loginLoading={adminLoginMutation.isPending}
      deleteLoading={deleteAllEntriesMutation.isPending}
    />
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <div className="min-h-screen">
            <Router />
          </div>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;