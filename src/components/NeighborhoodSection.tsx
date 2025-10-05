import { ReactNode } from "react";

interface NeighborhoodSectionProps {
  title: string;
  children: ReactNode;
}

const NeighborhoodSection = ({ title, children }: NeighborhoodSectionProps) => {
  return (
    <section className="mb-8">
      <h2 className="text-2xl font-bold mb-4 text-primary">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {children}
      </div>
    </section>
  );
};

export default NeighborhoodSection;
