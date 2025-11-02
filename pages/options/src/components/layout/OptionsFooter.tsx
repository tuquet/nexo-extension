const OptionsFooter = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t py-6">
      <div className="text-muted-foreground mx-auto max-w-6xl px-4 text-center text-sm">
        <p>© {currentYear} AI Script Generator. Built with React + Vite + shadcn/ui</p>
      </div>
    </footer>
  );
};

export default OptionsFooter;
