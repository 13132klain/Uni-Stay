export default function Footer() {
  return (
    <footer className="border-t py-8">
      <div className="container text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} UniStay. All rights reserved.</p>
        <p>Your trusted partner for student housing near Meru University.</p>
      </div>
    </footer>
  );
}
