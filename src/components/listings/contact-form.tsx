'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon, UsersIcon, LogInIcon, Loader2, SendIcon, MessageSquareIcon, PhoneIcon, MailIcon } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import type { House } from '@/lib/mock-data';
import { auth, db } from '@/lib/firebase';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type ContactFormProps = {
  house: House;
};

export default function ContactForm({ house }: ContactFormProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [guests, setGuests] = useState<number>(1);
  const [message, setMessage] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const maxAllowedTenants = 2;

  useEffect(() => {
    if (!auth) {
      setAuthLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !db) {
      toast({
        title: "Internal Error",
        description: "Firebase is not initialized. Please try again later.",
        variant: "destructive",
      });
      return;
    }
    if (!currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please log in to submit an inquiry.",
        variant: "destructive",
      });
      return;
    }
    if (!currentUser.email) {
      toast({
        title: "Email Not Available",
        description: "Your email address could not be retrieved. Please try logging out and back in.",
        variant: "destructive",
        duration: 7000,
      });
      return;
    }
    if (!date) {
      toast({
        title: "Move-in Date Required",
        description: "Please select a preferred move-in date.",
        variant: "destructive",
      });
      return;
    }
    if (guests < 1 || guests > maxAllowedTenants) {
      toast({
        title: "Invalid Number of Tenants",
        description: `Number of tenants must be between 1 and ${maxAllowedTenants}.`,
        variant: "destructive",
      });
      return;
    }
    if (!message.trim()) {
      toast({
        title: "Message Required",
        description: "Please provide a message about your interest in this property.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const inquiryData = {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        userName: currentUser.displayName || 'Unknown',
        houseId: house.id,
        houseName: house.name,
        houseAddress: house.address,
        agentName: house.agent.name,
        agentPhone: house.agent.phone,
        preferredMoveInDate: date,
        numberOfTenants: guests,
        message: message.trim(),
        status: 'new',
        rentAmount: house.price,
      };

      const response = await fetch('/api/send-inquiry-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inquiryData }),
      });
      const data = await response.json();
      if (!response.ok) {
        console.error('Inquiry submission error:', data.error);
        throw new Error(data.error || 'Failed to submit inquiry');
      }
      
      toast({
        title: "Inquiry Submitted",
        description: "Thank you! UniStay will contact you soon to discuss this property.",
        variant: "default",
        duration: 7000,
      });

      // Reset form
      setMessage('');
      setDate(new Date());
      setGuests(1);
    } catch (error: any) {
      console.error("Error submitting inquiry:", error);
      toast({
        title: "Submission Failed",
        description: "Could not submit your inquiry. Please try again. " + (error.message || ""),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <Card className="p-6 border rounded-lg shadow-sm bg-card">
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-3 text-muted-foreground">Loading contact form...</p>
        </div>
      </Card>
    );
  }

  if (!currentUser) {
    return (
      <Card className="p-6 border rounded-lg shadow-sm bg-card text-center">
        <CardHeader>
          <LogInIcon className="mx-auto h-10 w-10 text-primary mb-3" />
          <CardTitle className="text-xl font-semibold">Login to Contact</CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription className="mb-4">
            You need to be logged in to express interest in this property.
          </CardDescription>
          <Button asChild className="w-full">
            <Link href={`/auth/login?redirect=/listings/${house.id}`}>
              Login or Sign Up
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 border rounded-lg shadow-sm bg-card">
      <div className="text-center mb-4">
        <MessageSquareIcon className="mx-auto h-8 w-8 text-primary mb-2" />
        <h3 className="text-xl font-semibold">Express Interest</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Contact UniStay about this property
        </p>
      </div>

      <div>
        <Label htmlFor="date" className="mb-1 block">Preferred Move-in Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
              disabled={isSubmitting}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              initialFocus
              disabled={(day) => day < new Date(new Date().setHours(0,0,0,0))}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div>
        <Label htmlFor="guests" className="mb-1 block">Number of Tenants</Label>
        <div className="relative">
          <UsersIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="guests"
            type="number"
            value={guests}
            onChange={(e) => {
              const rawValue = e.target.value;
              let newGuestValue = guests; 
              if (rawValue === "") {
                newGuestValue = 1; 
              } else {
                const parsedNum = parseInt(rawValue, 10);
                if (!isNaN(parsedNum)) {
                  newGuestValue = Math.min(Math.max(1, parsedNum), maxAllowedTenants);
                }
              }
              setGuests(newGuestValue);
            }}
            min="1"
            max={maxAllowedTenants} 
            className="pl-10"
            disabled={isSubmitting}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">Max tenants allowed: {maxAllowedTenants}</p>
      </div>

      <div>
        <Label htmlFor="message" className="mb-1 block">Your Message</Label>
        <Textarea
          id="message"
          placeholder="Tell us about your interest in this property, any specific requirements, or questions you have..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="min-h-[100px]"
          disabled={isSubmitting}
          required
        />
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending Inquiry...
          </>
        ) : (
          <>
            <SendIcon className="mr-2 h-4 w-4" />
            Send Inquiry to UniStay
          </>
        )}
      </Button>

      <div className="text-center space-y-2">
        <p className="text-xs text-muted-foreground">
          UniStay will contact you within 24 hours to discuss this property.
        </p>
        <div className="flex items-center justify-center space-x-4 text-xs text-muted-foreground">
          <div className="flex items-center">
            <PhoneIcon className="h-3 w-3 mr-1" />
            <span>Call: +254 700 000 000</span>
          </div>
          <div className="flex items-center">
            <MailIcon className="h-3 w-3 mr-1" />
            <span>Email: inquiries@unistay.co.ke</span>
          </div>
        </div>
      </div>
    </form>
  );
} 