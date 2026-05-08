export const metadata = {
  title: "BRIMS — Sign In",
  description: "Sign in to the Border Road Inventory Management System.",
};

export default function AuthLayout({ children }) {
  return (
    <div className="h-screen overflow-hidden bg-[var(--color-bg-main)] flex items-center justify-center">
      {children}
    </div>
  );
}
