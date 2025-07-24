export const Card = ({ children }) => (
  <div className="border rounded-lg shadow-md bg-white">{children}</div>
);

export const CardContent = ({ children }) => (
  <div className="p-4">{children}</div>
);
