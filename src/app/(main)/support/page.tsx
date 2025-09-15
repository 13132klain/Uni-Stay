
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MailIcon, PhoneIcon, LifeBuoyIcon, UsersIcon } from "lucide-react";
import Link from "next/link";

const faqItems = [
  {
    question: "How do I create an account?",
    answer: "Click on the 'Sign Up' button in the navigation bar and fill in your details. You'll need to provide your name, email, and create a password."
  },
  {
    question: "How can I list my property?",
    answer: "Currently, UniStay focuses on students finding rentals. Property listing features for landlords will be available in a future update. For now, agents and landlords can contact us directly."
  },
  {
    question: "Is there a fee for using UniStay?",
    answer: "Creating an account and browsing listings is completely free for students. Booking fees, if any, will be clearly indicated during the booking process."
  },
  {
    question: "What is the Roommate Finder tool?",
    answer: "Our Roommate Finder helps you connect with other Meru University students who are also looking for roommates. You can create a profile and browse others to find a good match."
  },
  {
    question: "How do I report a suspicious listing or issue?",
    answer: "Please contact our support team immediately using the email or phone number provided on this page. Include as much detail as possible."
  }
];

export default function SupportPage() {
  return (
    <div className="container mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <LifeBuoyIcon className="mx-auto h-16 w-16 text-primary mb-4" />
        <h1 className="text-4xl font-bold tracking-tight mb-3">Customer Support</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          We're here to help! Find answers to common questions or get in touch with our team.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">Frequently Asked Questions (FAQ)</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {faqItems.map((item, index) => (
                  <AccordionItem value={`item-${index}`} key={index}>
                    <AccordionTrigger className="text-left hover:no-underline">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-1 space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">Contact Us</CardTitle>
              <CardDescription>
                Can't find what you're looking for? Reach out to us.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <MailIcon className="h-6 w-6 text-primary mt-1 shrink-0" />
                <div>
                  <h4 className="font-semibold">Email Support</h4>
                  <a href="mailto:support@unistay.com" className="text-primary hover:underline break-all">
                    support@unistay.com
                  </a>
                  <p className="text-xs text-muted-foreground">We typically reply within 24 hours.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <PhoneIcon className="h-6 w-6 text-primary mt-1 shrink-0" />
                <div>
                  <h4 className="font-semibold">Phone Support</h4>
                  <a href="tel:0799751598" className="text-primary hover:underline break-all">
                    0799751598
                  </a>
                  <p className="text-xs text-muted-foreground">Mon - Fri, 9 AM - 5 PM EAT.</p>
                </div>
              </div>
              <Button className="w-full" asChild>
                <Link href="mailto:support@unistay.com">Send Us An Email</Link>
              </Button>
            </CardContent>
          </Card>

           <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Office Location</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                UniStay Hub, Student Center Building,<br/>
                Meru University of Science and Technology,<br/>
                Meru, Kenya.
              </p>
              <div className="mt-4 h-40 bg-muted rounded-md flex items-center justify-center">
                 <p className="text-sm text-muted-foreground">(Placeholder for a map)</p>
                 {/* In a real app, you might embed Google Maps here */}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
