import { useState } from 'react';
    import { useNavigate } from 'react-router-dom';
    import { auth } from '@/firebase/config';
    import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { useToast } from '@/components/ui/use-toast';

    export default function LoginForm() {
      const [email, setEmail] = useState('');
      const [password, setPassword] = useState('');
      const [isSignUp, setIsSignUp] = useState(false);
      const navigate = useNavigate();
      const { toast } = useToast();

      const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
          if (isSignUp) {
            await createUserWithEmailAndPassword(auth, email, password);
            toast({
              title: "Account Created!",
              description: "You have successfully signed up. Please log in.",
            });
            setIsSignUp(false);
          } else {
            await signInWithEmailAndPassword(auth, email, password);
            navigate('/');
          }
        } catch (error: any) {
          toast({
            variant: "destructive",
            title: "Uh oh! Something went wrong.",
            description: error.message,
          });
        }
      };

      return (
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <div className="flex items-center">
              <Label htmlFor="password">Password</Label>
            </div>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full">
            {isSignUp ? 'Sign Up' : 'Login'}
          </Button>
          <Button variant="outline" className="w-full" onClick={() => setIsSignUp(!isSignUp)} type="button">
            {isSignUp ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
          </Button>
        </form>
      );
    }