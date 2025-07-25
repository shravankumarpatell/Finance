import { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/firebase/config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { Wallet, Mail } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function LoginForm() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  
  // Login form state
  const [loginData, setLoginData] = useState({
    mobile: '',
    password: ''
  });
  
  // Signup form state
  const [signupData, setSignupData] = useState({
    name: '',
    mobile: '',
    password: '',
    confirmPassword: ''
  });

  // Convert mobile number to email format for Firebase Auth
  const mobileToEmail = (mobile: string) => {
    // Remove any non-digit characters
    const cleanMobile = mobile.replace(/\D/g, '');
    return `${cleanMobile}@fintrack.app`;
  };

  // Validate mobile number (basic validation)
  const validateMobile = (mobile: string) => {
    const cleanMobile = mobile.replace(/\D/g, '');
    return cleanMobile.length >= 10 && cleanMobile.length <= 15;
  };

  // Save user data to Firestore
  const saveUserData = async (uid: string, name: string, mobile: string, email?: string) => {
    try {
      await setDoc(doc(db, 'users', uid), {
        name,
        mobile,
        email: email || mobileToEmail(mobile),
        createdAt: new Date(),
        authMethod: email ? 'google' : 'mobile'
      });
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  };

  // Handle mobile/password login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateMobile(loginData.mobile)) {
      toast({
        variant: "destructive",
        title: "Invalid Mobile Number",
        description: "Please enter a valid mobile number (10-15 digits)."
      });
      return;
    }

    if (!loginData.password) {
      toast({
        variant: "destructive",
        title: "Password Required",
        description: "Please enter your password."
      });
      return;
    }

    setLoading(true);
    
    try {
      const email = mobileToEmail(loginData.mobile);
      await signInWithEmailAndPassword(auth, email, loginData.password);
      
      toast({
        title: "Welcome back!",
        description: "You have been successfully logged in."
      });
    } catch (error: any) {
      console.error('Login error:', error);
      let errorMessage = "Login failed. Please try again.";
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = "No account found with this mobile number. Please sign up first.";
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = "Incorrect password. Please try again.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Invalid mobile number format.";
      }
      
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle mobile/password signup
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!signupData.name.trim()) {
      toast({
        variant: "destructive",
        title: "Name Required",
        description: "Please enter your full name."
      });
      return;
    }

    if (!validateMobile(signupData.mobile)) {
      toast({
        variant: "destructive",
        title: "Invalid Mobile Number",
        description: "Please enter a valid mobile number (10-15 digits)."
      });
      return;
    }

    if (signupData.password.length < 6) {
      toast({
        variant: "destructive",
        title: "Password Too Short",
        description: "Password must be at least 6 characters long."
      });
      return;
    }

    if (signupData.password !== signupData.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords Don't Match",
        description: "Please make sure both passwords are identical."
      });
      return;
    }

    setLoading(true);
    
    try {
      const email = mobileToEmail(signupData.mobile);
      const userCredential = await createUserWithEmailAndPassword(auth, email, signupData.password);
      
      // Update the user's profile with their name
      await updateProfile(userCredential.user, {
        displayName: signupData.name
      });

      // Save user data to Firestore
      await saveUserData(userCredential.user.uid, signupData.name, signupData.mobile);
      
      toast({
        title: "Account Created!",
        description: `Welcome ${signupData.name}! Your account has been created successfully.`
      });
    } catch (error: any) {
      console.error('Signup error:', error);
      let errorMessage = "Failed to create account. Please try again.";
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "An account with this mobile number already exists. Please try logging in instead.";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "Password is too weak. Please use a stronger password.";
      }
      
      toast({
        variant: "destructive",
        title: "Signup Failed",
        description: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle Google authentication
  const handleGoogleAuth = async () => {
    setGoogleLoading(true);
    
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Check if user already exists in Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        // New user, save their data
        await saveUserData(
          user.uid, 
          user.displayName || 'Google User', 
          user.phoneNumber || '', 
          user.email || ''
        );
        
        toast({
          title: "Welcome to FinTrack!",
          description: `Hi ${user.displayName}! Your account has been created successfully.`
        });
      } else {
        toast({
          title: "Welcome back!",
          description: `Hi ${user.displayName}! You have been successfully logged in.`
        });
      }
    } catch (error: any) {
      console.error('Google auth error:', error);
      let errorMessage = "Google authentication failed. Please try again.";
      
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = "Authentication was cancelled. Please try again.";
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = "Popup was blocked by your browser. Please allow popups and try again.";
      }
      
      toast({
        variant: "destructive",
        title: "Google Auth Failed",
        description: errorMessage
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Wallet className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">Welcome to FinTrack</CardTitle>
          <CardDescription>
            Track your finances across multiple workplaces
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            {/* Login Tab */}
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-mobile">Mobile Number</Label>
                  <Input
                    id="login-mobile"
                    type="tel"
                    placeholder="Enter your mobile number"
                    value={loginData.mobile}
                    onChange={(e) => setLoginData({ ...loginData, mobile: e.target.value })}
                    disabled={loading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="Enter your password"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    disabled={loading}
                  />
                </div>
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Signing In...' : 'Sign In'}
                </Button>
              </form>
            </TabsContent>
            
            {/* Signup Tab */}
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Enter your full name"
                    value={signupData.name}
                    onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                    disabled={loading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-mobile">Mobile Number</Label>
                  <Input
                    id="signup-mobile"
                    type="tel"
                    placeholder="Enter your mobile number"
                    value={signupData.mobile}
                    onChange={(e) => setSignupData({ ...signupData, mobile: e.target.value })}
                    disabled={loading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Create a password (min 6 characters)"
                    value={signupData.password}
                    onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                    disabled={loading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Confirm your password"
                    value={signupData.confirmPassword}
                    onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                    disabled={loading}
                  />
                </div>
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          
          {/* Google Auth Section */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>
            
            <Button
              type="button"
              variant="outline"
              className="w-full mt-4"
              onClick={handleGoogleAuth}
              disabled={googleLoading || loading}
            >
              <Mail className="mr-2 h-4 w-4" />
              {googleLoading ? 'Connecting...' : 'Continue with Google'}
            </Button>
          </div>
          
          <p className="text-xs text-center text-muted-foreground mt-4">
            By signing up, you agree to our Terms of Service and Privacy Policy
          </p>
        </CardContent>
      </Card>
    </div>
  );
}